import mongoose, { mongo } from "mongoose";
import { getGridfsBucket } from "../config/gridfs.config.js";
import conversation from "../models/chat.model.js";
import { Readable } from "stream";

export const uploadFile = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const { sender, receiver } = req.body;

		if (!sender || !receiver) {
			return res.status(400).json({ error: "Sender & Receiver are required" });
		}

		const gridfsBucket = getGridfsBucket();

		if (!gridfsBucket) {
			res.status(500).json({ error: "GridFS not Initialized" });
		}

		// Generate unique filename
		const filename = `${Date.now()}-${req.file.originalname}`;

		// create a readable stream from buffer
		const readableStream = new Readable();
		readableStream.push(req.file.buffer);
		readableStream.push(null);

		// create upload stream
		const uploadStream = gridfsBucket.openUploadStream(filename, {
			contentType: req.file.mimetype,
			metadata: {
				originalName: req.file.originalname,
				sender,
				receiver,
			},
		});

		// pipe the file buffer to GridFS
		readableStream.pipe(uploadStream);

		uploadStream.on("finish", async () => {
			try {
				// console.log("uploadStream.id : ", uploadStream.id);
				// console.log("req =======>>>>>>>> ", req);
				// create file message object
				const fileMessage = {
					sender,
					receiver,
					messageType: "file",
					fileId: uploadStream.id,
					fileName: req.file.originalname,
					fileType: req.file.mimetype,
					fileSize: req.file.size,
					messageId: `${Date.now()}-${Math.random()}`,
					timestamp: new Date(),
				};
				// console.log("fileMessage: ", fileMessage);

				// find or create conversation
				// const participants = [sender, receiver];

				// let Conversation = await conversation.findOne({ users: { $all: participants } });

				// if (!Conversation) {
				// 	Conversation = await conversation.create({ users: participants });
				// }

				// console.log("Conversation: ", Conversation);

				// Add file msg to conversation
				// Conversation.msgs.push(fileMessage);
				// await Conversation.save();

				// Log to verify all fields are present
				// console.log("File message created:", fileMessage);

				res.status(200).json({
					success: true,
					message: "File uploaded successfully.",
					file: {
						id: uploadStream.id,
						filename: filename,
						originalName: req.file.originalname,
						size: req.file.size,
						type: req.file.mimetype,
					},
					fileMessage,
				});
			} catch (error) {
				console.error("Error uploading to database: ", error);
				res.status(500).json({ error: "Error uploading file message" });
			}
		});

		uploadStream.on("error", (error) => {
			console.error("Upload stream error : ", error);
			res.status(500).json({ error: "Error uploading file to GridFS" });
		});
	} catch (error) {
		console.error("Upload error : ", error);
		res.status(500).json({ error: error.message || "File upload failed" });
	}
};

export const getFile = async (req, res) => {
	try {
		const { fileId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(fileId)) {
			return res.status(400).json({ error: "Invalid File ID" });
		}

		const gridfsBucket = getGridfsBucket();

		if (!gridfsBucket) {
			return res.status(500).json({ error: "GridFS not initialized" });
		}

		// find file metadata
		const files = await gridfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

		if (!files || files.length === 0) {
			return res.status(404).json({ error: "File not found" });
		}

		const file = files[0];

		// set appropriate headers
		res.set("Content-Type", file.contentType || "application/octet-stream");
		res.set("Content-Length", file.length);
		res.set(
			"Content-Disposition",
			`inline; filename="${file.metadata?.originalName || file?.filename}"`
		);

		// Stream file to response
		const downloadStream = gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

		downloadStream.on("error", (error) => {
			console.error("Stream error: ", error);
			if (!res.headersSent) {
				res.status(404).json({ error: "File not found or error streaming file" });
			}
		});

		downloadStream.pipe(res);
	} catch (error) {
		console.error("Error retrieving file: ", error);
		if (!res.headersSent) {
			res.status(500).json({ error: error.message || "Error retrieving file" });
		}
	}
};

export const deleteFile = async (req, res) => {
	try {
		const { fileId } = req.params;

		if (!mongoose.Types.ObjectId.isValid(fileId)) {
			return res.status(400).json({ error: "Invalid file ID" });
		}

		const gridfsBucket = getGridfsBucket();

		if (!gridfsBucket) {
			return res.status(500).json({ error: "GridFS not initialized" });
		}

		await gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));

		res.status(200).json({ success: true, message: "File deleted successfully" });
	} catch (error) {
		console.error("Error deleting file:", error);
		res.status(500).json({ error: error.message || "Error deleting file" });
	}
};