import express from "express";
import { getMsgsForConversation } from "../controllers/msgs.controller.js";

const msgsRouter = express.Router();

msgsRouter.get("/", getMsgsForConversation);

export default msgsRouter;
