import express from "express";
import { upload } from "../config/gridfs.config.js";
import {
	uploadFile,
	getFile,
	deleteFile,
	summarizeDocumentFile,
} from "../controllers/file.controller.js";

const fileRouter = express.Router();

// Upload file
fileRouter.post("/upload", upload.single("file"), uploadFile);

// Get/Download file
fileRouter.get("/:fileId", getFile);

// Delete file
fileRouter.delete("/:fileId", deleteFile);

// Document summary endpoint
fileRouter.post("/summarize/:fileId", summarizeDocumentFile);

export default fileRouter;