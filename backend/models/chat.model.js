import mongoose from "mongoose";

const msgSchema = mongoose.Schema({
	messageId: {
		type: String,
		required: true,
		unique: true,
	},
	text: {
		type: String,
		required: false, // false since file messages might not have text
	},
	sender: {
		type: String,
		required: true,
	},
	receiver: {
		type: String,
		required: true,
	},
	messageType: {
		type: String,
		enum: ["text", "file"],
		default: "text",
	},
	status: {
		type: String,
		enum: ["sent", "delivered", "seen"],
		default: "sent",
	},
	// File-specific fields
	fileId: {
		type: mongoose.Schema.Types.ObjectId,
		required: false,
	},
	fileName: {
		type: String,
		required: false,
	},
	fileType: {
		type: String,
		required: false,
	},
	fileSize: {
		type: Number,
		required: false,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
});

const conversationSchema = mongoose.Schema({
	users: [
		{
			type: String,
			required: true,
		},
	],
	msgs: [msgSchema],
});

const conversation = mongoose.model("conversation", conversationSchema);

export default conversation;
