import express from "express";
import dotenv from "dotenv";
import authRouter from "./auth/auth.route.js";
import connectToMongoDB from "./db/connectToMongoDB.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.use("/auth", authRouter);

// Define a route
app.get("/", (req, res) => {
  res.send("Congratulations Mad World Folks!");
});

// Start the server
app.listen(PORT, (req, res) => {
  connectToMongoDB();
  console.log(`Server is listening at http://localhost:${PORT}`);
});
