import express from "express";
import dotenv from "dotenv";
import authRouter from "./auth/auth.route.js";
import usersRouter from "./auth/users.route.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
const PORT = process.env.PORT || 8081;

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
	cors({
		credentials: true,
		origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
	})
);

app.use("/auth", authRouter);
app.use("/users", usersRouter);

// Define a route
app.get("/", (req, res) => {
	res.send("Congratulations Mad World Folks!");
});

// Start the server
app.listen(PORT, (req, res) => {
	connectToMongoDB();
	console.log(`Server is listening at http://localhost:${PORT}`);
});
