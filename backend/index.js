import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

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

io.on("connection", (socket) => {
  console.log("client connected");
  socket.on('chat msg', (msg) => {
    console.log('received msg : ' + msg);
  });
  // console.log("received msg : " + msg);
  // socket.broadcast.emit(msg);
});

// Define a route
app.get("/", (req, res) => {
  res.send("Congratulations Mad World Folks!");
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening at http://localhost:${PORT}`);
});
