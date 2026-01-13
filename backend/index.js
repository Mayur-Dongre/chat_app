import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { addMsgToConversation, updateMsgStatus } from "./controllers/msgs.controller.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import msgsRouter from "./routes/msgs.route.js";
import fileRouter from "./routes/file.route.js";
import cors from "cors";
import { initGridFS } from "./config/gridfs.config.js";
import { subscribe, publish } from "./redis/msgsPubSub.js";

dotenv.config();
const PORT = process.env.PORT || 8080;
// const SERVER_ID = process.env.SERVER_ID || `server-${PORT}`; // Unique ID for this server instance

const app = express();

// CORS configuration
// CORS middleware - handles preflight OPTIONS automatically
app.use(cors({
	origin: function (origin, callback) {
		if (!origin) return callback(null, true);
		callback(null, origin);
	},
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	preflightContinue: false,
	optionsSuccessStatus: 204,
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: function (origin, callback) {
			if (!origin) return callback(null, true);
			callback(null, origin);
		},
		credentials: true,
		methods: ["GET", "POST"],
	},
	// Adding these options for better compatibility
	transports: ["websocket", "polling"],
	allowEIO3: true,
});

const userSocketMap = {}; // { username: socket }
const userStatusMap = {}; // { username: { online: true, lastSeen: Date } }

// Subscribe to global channels for cross-server events
const CHANNELS = {
	USER_STATUS: "global_user_status",
	TYPING: "global_typing",
	DISCONNECT: "global_disconnect",
};

// Subscribe to global user status channel
subscribe(CHANNELS.USER_STATUS, (message) => {
	const data = JSON.parse(message);
	console.log(`[Redis] Received user status update:`, data);

	// Update local status map
	userStatusMap[data.username] = {
		online: data.online,
		lastSeen: data.lastSeen,
	};

	// Broadcast to all connected clients on THIS server
	io.emit("user status", data);
});

// Subscribe to global typing channel
subscribe(CHANNELS.TYPING, (message) => {
	const data = JSON.parse(message);
	console.log(`[Redis] Received typing indicator:`, data);

	// Send to receiver if they're connected to THIS server
	const receiverSocket = userSocketMap[data.receiver];
	if (receiverSocket) {
		receiverSocket.emit("user typing", {
			sender: data.sender,
			isTyping: data.isTyping,
		});
	}
});

io.on("connection", (socket) => {
	const username = socket.handshake.query.username;
	console.log("Username of client connected: ", username);

	// Store socket and mark user as online
	userSocketMap[username] = socket;
	userStatusMap[username] = {
		online: true,
		lastSeen: new Date(),
	};

	// Subscribe to user-specific channel for direct messages
	const userChannel = `chat_${username}`;
	subscribe(userChannel, (msg) => {
		const parsedMsg = JSON.parse(msg);
		console.log(`[Redis] Received msg for ${username}:`, parsedMsg);

		// Emit based on message type
		if (parsedMsg.type === "chat_msg") {
			socket.emit("chat msg", parsedMsg.data);
		} else if (parsedMsg.type === "file_msg") {
			socket.emit("file msg", parsedMsg.data);
		} else if (parsedMsg.type === "msg_delivered") {
			socket.emit("msg delivered", parsedMsg.data);
		} else if (parsedMsg.type === "msg_seen") {
			socket.emit("msg seen", parsedMsg.data);
		}
	});

	// Broadcast user online status to ALL servers
	const userStatusData = {
		username,
		online: true,
		lastSeen: new Date(),
		// serverId: SERVER_ID,
	};
	publish(CHANNELS.USER_STATUS, JSON.stringify(userStatusData));

	// send all users' status to the newly connected user
	socket.emit("all users status", userStatusMap);

	socket.on("chat msg", (msg) => {
		const receiverSocket = userSocketMap[msg.receiver];

		// Add timestamp if not present
		const msgWithTimestamp = {
			...msg,
			timestamp: msg.timestamp || new Date().toISOString(),
			status: msg.status || "sent",
			messageId: msg.messageId,
		};

		console.log("Received message with ID:", msgWithTimestamp.messageId);

		if (receiverSocket) {
			// Receiver is on THIS server
			receiverSocket.emit("chat msg", msgWithTimestamp);
			console.log("Message sent to receiver on same server:", msg.receiver);
		} else {
			// Receiver is on DIFFERENT server - use Redis
			const channelName = `chat_${msg.receiver}`;
			publish(
				channelName,
				JSON.stringify({
					type: "chat_msg",
					data: msgWithTimestamp,
				})
			);
			console.log(`Message published to Redis for receiver: ${msg.receiver}`);
		}

		// Save to database
		addMsgToConversation([msg.sender, msg.receiver], {
			text: msg.text,
			sender: msg.sender,
			receiver: msg.receiver,
			timestamp: msgWithTimestamp.timestamp,
			messageId: msgWithTimestamp.messageId,
			status: msgWithTimestamp.status,
			messageType: msg.messageType || "text",
		});
	});

	// Handle file message through socket
	socket.on("file msg", (fileMsg) => {
		const receiverSocket = userSocketMap[fileMsg.receiver];

		const fileMsgWithStatus = {
			...fileMsg,
			status: fileMsg.status || "sent",
			messageId: fileMsg.messageId,
		};

		if (receiverSocket) {
			// Receiver on THIS server
			receiverSocket.emit("file msg", fileMsgWithStatus);
		} else {
			// Receiver on DIFFERENT server
			const channelName = `chat_${fileMsg.receiver}`;
			publish(
				channelName,
				JSON.stringify({
					type: "file_msg",
					data: fileMsgWithStatus,
				})
			);
		}

		// Save to database
		addMsgToConversation([fileMsg.sender, fileMsg.receiver], {
			sender: fileMsg.sender,
			receiver: fileMsg.receiver,
			messageType: "file",
			fileId: fileMsg.fileId,
			fileName: fileMsg.fileName,
			fileType: fileMsg.fileType,
			fileSize: fileMsg.fileSize,
			timestamp: fileMsg.timestamp,
			messageId: fileMsg.messageId,
			status: fileMsgWithStatus.status,
		});
	});

	// handle msgs delivered ack
	socket.on("msg delivered ack", (data) => {
		const senderSocket = userSocketMap[data.sender];
		console.log(`Delivery ack for message:`, data.messageId);

		const deliveryData = {
			messageId: data.messageId,
			timestamp: new Date().toISOString(),
		};

		if (senderSocket) {
			// Sender on THIS server
			senderSocket.emit("msg delivered", deliveryData);
			console.log("Delivery confirmation sent to sender on same server");
		} else {
			// Sender on DIFFERENT server
			const channelName = `chat_${data.sender}`;
			publish(
				channelName,
				JSON.stringify({
					type: "msg_delivered",
					data: deliveryData,
				})
			);
			console.log(`Delivery confirmation published to Redis for sender: ${data.sender}`);
		}

		// update msg status in database
		updateMsgStatus([data.sender, socket.handshake.query.username], data.messageId, "delivered");
	});

	// handle msg seen/read
	socket.on("msg seen", (data) => {
		const senderSocket = userSocketMap[data.sender];
		console.log(`Seen ack for message:`, data.messageId);

		const seenData = {
			messageId: data.messageId,
			timestamp: new Date().toISOString(),
		};

		if (senderSocket) {
			// Sender on THIS server
			senderSocket.emit("msg seen", seenData);
			console.log("Seen confirmation sent to sender on same server");
		} else {
			// Sender on DIFFERENT server
			const channelName = `chat_${data.sender}`;
			publish(
				channelName,
				JSON.stringify({
					type: "msg_seen",
					data: seenData,
				})
			);
			console.log(`Seen confirmation published to Redis for sender: ${data.sender}`);
		}

		// update msg status in DB
		updateMsgStatus([data.sender, socket.handshake.query.username], data.messageId, "seen");
	});

	// handle typing indicator
	socket.on("typing", (data) => {
		const receiverSocket = userSocketMap[data.receiver];

		const typingData = {
			sender: username,
			receiver: data.receiver,
			isTyping: data.isTyping,
		};

		if (receiverSocket) {
			// Receiver on THIS server
			receiverSocket.emit("user typing", {
				sender: username,
				isTyping: data.isTyping,
			});
		} else {
			// Receiver on DIFFERENT server
			publish(CHANNELS.TYPING, JSON.stringify(typingData));
		}
	});

	socket.on("disconnect", () => {
		console.log(`User disconnected:`, username);

		// Remove from local map
		delete userSocketMap[username];

		// Unsubscribe from user-specific channel
		// const userChannel = `chat_${username}`;
		// unsubscribe(userChannel);

		// Update status
		const disconnectData = {
			username,
			online: false,
			lastSeen: new Date(),
			// serverId: SERVER_ID,
		};

		userStatusMap[username] = {
			online: false,
			lastSeen: disconnectData.lastSeen,
		};

		// Broadcast offline status to ALL servers
		publish(CHANNELS.USER_STATUS, JSON.stringify(disconnectData));
	});
});

// Routes
app.use("/msgs", msgsRouter);
app.use("/files", fileRouter);

// Define a route
app.get("/", (req, res) => {
	res.send(`Chat Backend Server Running!`);
});

// get user status endpoint
app.get("/user-status/:username", (req, res) => {
	const { username } = req.params;
	const status = userStatusMap[username] || { online: false, lastSeen: null };
	res.json(status);
});

// Endpoint to check connected users on this server
app.get("/server-stats", (req, res) => {
	res.json({
		// serverId: SERVER_ID,
		connectedUsers: Object.keys(userSocketMap),
		totalUsers: Object.keys(userSocketMap).length,
		allKnownUsers: Object.keys(userStatusMap).length,
	});
});

// Start the server
server.listen(PORT, async () => {
	await connectToMongoDB();
	// Initialize GridFS after mongoDB connection
	setTimeout(() => {
		initGridFS();
	}, 1000);
	console.log(`Server is listening at http://localhost:${PORT}`);
	console.log(`Redis Pub/Sub enabled for cross-server communication`);
});
