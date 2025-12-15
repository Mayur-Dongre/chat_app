import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import msgsRouter from "./routes/msgs.route.js";
import cors from "cors";
import { initGridFS } from "./config/gridfs.config.js";
import fileRouter from "./routes/file.route.js";

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

const userSocketMap = {};

io.on("connection", (socket) => {
	const username = socket.handshake.query.username;
	console.log("Username of client connected: ", username);

	userSocketMap[username] = socket;

	socket.on("chat msg", (msg) => {
		const receiverSocket = userSocketMap[msg.receiver];

		// Add timestamp if not present
		const msgWithTimestamp = {
			...msg,
			timestamp: msg.timestamp || new Date().toISOString(),
		};

		if (receiverSocket) {
			receiverSocket.emit("chat msg", msgWithTimestamp);
		}

		addMsgToConversation([msg.sender, msg.receiver], {
			text: msg.text,
			sender: msg.sender,
			receiver: msg.receiver,
			timestamp: msgWithTimestamp.timestamp,
		});
	});

	// Handle file message through socket
	socket.on("file msg", (fileMsg) => {
		const receiverSocket = userSocketMap[fileMsg.receiver];
		if (receiverSocket) {
			receiverSocket.emit("file msg", fileMsg);
		}
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", username);
		delete userSocketMap[username];
	});
});

// Routes
app.use("/msgs", msgsRouter);
app.use("/files", fileRouter);

// Define a route
app.get("/", (req, res) => {
	res.send("Congratulations Mad World Folks!");
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
