import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import msgsRouter from "./routes/msgs.route.js";
import cors from "cors";

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
		if (receiverSocket) {
			receiverSocket.emit("chat msg", msg);
		}

		addMsgToConversation([msg.sender, msg.receiver], {
			text: msg.text,
			sender: msg.sender,
			receiver: msg.receiver,
		});
	});
});

app.use("/msgs", msgsRouter);

// Define a route
app.get("/", (req, res) => {
	res.send("Congratulations Mad World Folks!");
});

// Start the server
server.listen(PORT, () => {
	connectToMongoDB();
	console.log(`Server is listening at http://localhost:${PORT}`);
});
