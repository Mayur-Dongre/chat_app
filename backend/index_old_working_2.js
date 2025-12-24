import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import msgsRouter from "./routes/msgs.route.js";
import fileRouter from "./routes/file.route.js";
import cors from "cors";
import { initGridFS } from "./config/gridfs.config.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

const app = express();

// add cors middleware for express routes
app.use(
	cors({
		origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true, // Add this line
	})
);

// add a json parser if you are handling JSON data
app.use(express.json());

const server = http.createServer(app);
// const io = new Server(server);
const io = new Server(server, {
	cors: {
		allowedHeaders: ["*"],
		origin: "*",
	},
});

const userSocketMap = {}; // { username: socket }
const userStatusMap = {}; // { username: { online: true, lastSeen: Date } }

io.on("connection", (socket) => {
	const username = socket.handshake.query.username;
	console.log("Username of client connected: ", username);

	// store the socket & mark the user as online
	userSocketMap[username] = socket;
	userStatusMap[username] = {
		online: true,
		lastSeen: new Date(),
	};

	// broadcast to all users that this user is online
	io.emit("user status", {
		username,
		online: true,
		lastSeen: new Date(),
	});

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
			receiverSocket.emit("chat msg", msgWithTimestamp);
			console.log("Message sent to receiver:", msg.receiver);
			
			// send delivery confirmation
			// CHANGE-1: commented below 4 lines	/////////////////////////////////////////////
			// socket.emit("msg delivered", {
			// 	messageId: msgWithTimestamp.messageId,
			// 	timestamp: new Date().toISOString(),
			// });
		}

		addMsgToConversation([msg.sender, msg.receiver], {
			text: msg.text,
			sender: msg.sender,
			receiver: msg.receiver,
			timestamp: msgWithTimestamp.timestamp,
			messageId: msgWithTimestamp.messageId,
			status: msgWithTimestamp.status,
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
			receiverSocket.emit("file msg", fileMsgWithStatus);

			// send delivery confirmation
			// CHANGE-2: commented below 4 lines	/////////////////////////////////////////////
			// socket.emit("msg delivered", {
			// 	messageId: fileMsgWithStatus.messageId,
			// 	timestamp: new Date().toISOString(),
			// });
		}
	});

	// handle msgs delivered ack
	socket.on("msg delivered ack", (data) => {
		const senderSocket = userSocketMap[data.sender];
		console.log("Delivery ack received for message:", data.messageId, "to sender:", data.sender);

		if (senderSocket) {
			senderSocket.emit("msg delivered", {
				messageId: data.messageId,
				timestamp: new Date().toISOString(),
			});
			console.log("Delivery confirmation sent to sender");
		}
	});

	// handle msg seen or read
	socket.on("msg seen", (data) => {
		const senderSocket = userSocketMap[data.sender];
		console.log("Seen ack received for message:", data.messageId, "to sender:", data.sender);

		if (senderSocket) {
			senderSocket.emit("msg seen", {
				messageId: data.messageId,
				timestamp: new Date().toISOString(),
			});
			console.log("Seen confirmation sent to sender");
		}

		// update msg status in DB
		addMsgToConversation([data.sender, socket.handshake.query.username], {
			messageId: data.messageId,
			status: "seen",
		});
	});

	// handle typing indicator
	socket.on("typing", (data) => {
		const receiverSocket = userSocketMap[data.receiver];
		if (receiverSocket) {
			receiverSocket.emit("user typing", {
				sender: username,
				isTyping: data.isTyping,
			});
		}
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", username);
		delete userSocketMap[username];

		// Update the user status to offline with last seen
		userStatusMap[username] = {
			online: false,
			lastSeen: new Date(),
		};

		// broadcast to all users that this user is offline
		io.emit("user status", {
			username,
			online: false,
			lastSeen: new Date(),
		});
	});
});

// Routes
app.use("/msgs", msgsRouter);
app.use("/files", fileRouter);

// Define a route
app.get("/", (req, res) => {
	res.send("Congratulations Mad World Folks!");
});

// get user status endpoint
app.get("/user-status/:username", (req, res) => {
	const { username } = req.params;
	const status = userStatusMap[username] || { online: false, lastSeen: null };
	res.json(status);
});

// Start the server
server.listen(PORT, async () => {
	await connectToMongoDB();
	// Initialize GridFS after mongoDB connection
	setTimeout(() => {
		initGridFS();
	}, 1000);
	console.log(`Server is listening at http://localhost:${PORT}`);
});
