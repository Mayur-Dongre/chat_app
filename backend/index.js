import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import connectToMongoDB from "./db/connectToMongoDB.js";

dotenv.config();
const PORT = process.env.PORT || 8080;

const app = express();

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
		if (receiverSocket) {
			receiverSocket.emit("chat msg", msg);
		}

		addMsgToConversation([msg.sender, msg.receiver], {
			text: msg.textMsg,
			sender: msg.sender,
			receiver: msg.receiver,
		});

		// socket.broadcast.emit('chat msg', msg);
		// console.log("received msg : " + msg);
		// console.log("msg.textMsg: ", msg.textMsg);
		// console.log("msg.sender: ", msg.sender);
		// console.log("msg.receiver: ", msg.receiver);
		// socket.broadcast.emit("chat msg", msg);
	});
});

// Define a route
app.get("/", (req, res) => {
	res.send("Congratulations Mad World Folks!");
});

// Start the server
server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`Server is listening at http://localhost:${PORT}`);
});
