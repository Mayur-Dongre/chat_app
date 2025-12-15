import express from "express";
import { upload } from "../config/gridfs.config.js";
import { uploadFile, getFile, deleteFile } from "../controllers/file.controller.js";

const fileRouter = express.Router();

// Upload file
fileRouter.post("/upload", upload.single("file"), uploadFile);

// Get/Download file
fileRouter.get("/:fileId", getFile);

// Delete file (optional)
fileRouter.delete("/:fileId", deleteFile);

export default fileRouter;