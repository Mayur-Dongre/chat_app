import mongoose, { mongo } from "mongoose";
import { getGridfsBucket } from "../config/gridfs.config.js";
import { Readable } from "stream";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
			return res.status(500).json({ error: "GridFS not Initialized" });
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
				contentType: req.file.mimetype,
			},
		});

		// pipe the file buffer to GridFS
		readableStream.pipe(uploadStream);

		uploadStream.on("finish", async () => {
			try {
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
		res.set("Content-Type", file.metadata.contentType || "application/octet-stream");
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

// Summarize document by streaming from GridFS using Google Gemini
export const summarizeDocumentFile = async (req, res) => {
	try {
		const { fileId } = req.params;
		const { userMessage } = req.body;

		console.log("Summarizing document with Gemini API");
		console.log("fileId : ", fileId);
		console.log("userMessage : ", userMessage);

		if (!mongoose.Types.ObjectId.isValid(fileId)) {
			return res.status(400).json({ error: "Invalid File ID" });
		}

		const gridfsBucket = getGridfsBucket();

		if (!gridfsBucket) {
			return res.status(500).json({ error: "GridFS not initialized" });
		}

		// Find file metadata
		const files = await gridfsBucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

		if (!files || files.length === 0) {
			return res.status(404).json({ error: "File not found" });
		}

		const file = files[0];

		console.log("file : ", file);

		// file types supported by Gemini
		const supportedTypes = [
			"application/pdf",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			"text/plain",
			"application/msword",
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
			"image/heic",
			"image/heif",
		];

		if (!supportedTypes.includes(file.metadata.contentType)) {
			console.log("file.metadata.contentType : ", file.metadata.contentType);
			return res.status(400).json({
				error: `Unsupported file type: ${file.metadata.contentType}. Supported types: PDF, DOCX, DOC, TXT, and images.`,
			});
		}

		// Download file to buffer
		const downloadStream = gridfsBucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

		const chunks = [];
		for await (const chunk of downloadStream) {
			chunks.push(chunk);
		}
		const fileBuffer = Buffer.concat(chunks);

		// Convert buffer to base64 (for sending to Gemini)
		const base64Content = fileBuffer.toString("base64");

		// Call Gemini API function
		const summary = await summarizeDocumentWithGemini(
			base64Content,
			file.metadata.contentType,
			file.metadata?.originalName || file.filename,
			userMessage
		);

		res.status(200).json({
			success: true,
			summary,
			fileName: file.metadata?.originalName || file.filename,
			fileType: file.metadata.contentType,
		});
	} catch (error) {
		console.error("Error summarizing document:", error);
		res.status(500).json({
			error: error.message || "Failed to summarize document",
		});
	}
};

// Helper function to call Google Gemini API with document
async function summarizeDocumentWithGemini(base64Content, mimeType, fileName, userPrompt) {
	try {
		
		if (!process.env.GEMINI_API_KEY) {
			throw new Error("GEMINI_API_KEY not configured in environment variables");
		}

		const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

		// Using gemini-2.0-flash-exp for best free performance
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash",
			generationConfig: {
				temperature: 0.3,
				topP: 0.95,
				topK: 40,
				maxOutputTokens: 4096,
			},
		});

		const prompt = userPrompt
			? `${userPrompt}\n\nDocument: ${fileName}`
			: `Please provide a comprehensive summary of the document "${fileName}". Include the main points, key takeaways, and any important details.`;

		// the content parts
		const parts = [
			{
				inlineData: {
					mimeType: mimeType,
					data: base64Content,
				},
			},
			{ text: prompt },
		];

		console.log("Calling Gemini API...");
		const result = await model.generateContent(parts);
		const response = result.response;
		const text = response.text();

		console.log("Gemini API response received successfully");
		return text;
	} catch (error) {
		console.error("Error calling Gemini API:", error);
		console.error("Error message:", error.message);

		if (error.message?.includes("API key")) {
			throw new Error(
				"Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable."
			);
		}

		throw new Error("Failed to process document with AI: " + error.message);
	}
}
