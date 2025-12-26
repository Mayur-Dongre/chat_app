import mongoose from "mongoose";
import multer from "multer";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let gridfsBucket;

// Initialize gridFS once mongoose connects
const initGridFS = () => {
	if (mongoose.connection.readyState === 1) {
		gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
			bucketName: "uploads",
		});
		console.log("GridFS initialized successfully");
	}
};

// Initialize after connection
mongoose.connection.once("open", () => {
	initGridFS();
});

// Use memory storage for multer
const storage = multer.memoryStorage();

// File filter for allowed types
const fileFilter = (req, file, cb) => {
	// Allowed file types
	const allowedMimeTypes = [
		// Images
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		// Documents
		"application/pdf",
		"text/plain",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		// Spreadsheets
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		// Videos
		"video/mp4",
		"video/mpeg",
		"video/quicktime",
		"video/x-msvideo",
		"video/webm",
	];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only images, PDFs, documents, spreadsheets, and videos are allowed."
			),
			false
		);
	}
};

const upload = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
	fileFilter,
});

const getGridfsBucket = () => gridfsBucket;

export { upload, getGridfsBucket, initGridFS };

// export gridfsBucket;