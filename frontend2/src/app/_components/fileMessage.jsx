import { useState } from "react";
import axios from "axios";

const FileMessage = ({ message, isSentByCurrentUser, onSummarize }) => {
	const [summarizing, setSummarizing] = useState(false);

	const getFileIcon = (fileType) => {
		if (!fileType) return "📎";
		if (fileType.startsWith("image/")) return "🖼️";
		if (fileType.includes("pdf")) return "📄";
		if (fileType.includes("word") || fileType.includes("doc")) return "📝";
		if (fileType.includes("excel") || fileType.includes("sheet")) return "📊";
		if (fileType.startsWith("video/")) return "🎥";
		return "📎";
	};

	const formatFileSize = (bytes) => {
		if (!bytes) return "0 B";
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	const handleDownload = () => {
		window.open(`https://backend2-9yyf.onrender.com/files/${message.fileId}`, "_blank");
	};

	const handleImageClick = (e) => {
		e.stopPropagation();
		window.open(`https://backend2-9yyf.onrender.com/files/${message.fileId}`, "_blank");
	};

	// Handle document summarization
	const handleSummarize = async (e) => {
		e.stopPropagation();

		if (summarizing) return;

		try {
			setSummarizing(true);

			const response = await axios.post(
				`https://backend2-9yyf.onrender.com/files/summarize/${message.fileId}`,
				{
					userMessage: "Summarize this document",
				}
			);

			// Call parent component to add AI summary to chat
			if (onSummarize) {
				onSummarize(response.data.summary, message.fileName);
			}
		} catch (error) {
			console.error("Error summarizing document:", error);
			alert(error.response?.data?.error || "Failed to summarize document");
		} finally {
			setSummarizing(false);
		}
	};

	// Check if file can be summarized
	const canSummarize = () => {
		if (!message.fileType) return false;
		return (
			message.fileType.includes("pdf") ||
			message.fileType.includes("word") ||
			message.fileType.includes("doc") ||
			message.fileType.includes("text")
		);
	};

	// Safety check
	if (!message || !message.fileId) {
		return <div className="text-red-500 text-sm">⚠️ File data missing</div>;
	}

	const fileType = message.fileType || "";
	const isImage = fileType.startsWith("image/");
	const isVideo = fileType.startsWith("video/");

	return (
		<div className="file-message">
			{isImage ? (
				<div className="relative group">
					<img
						src={`https://backend2-9yyf.onrender.com/files/${message.fileId}`}
						alt={message.fileName || "Uploaded image"}
						className="max-w-[300px] max-h-[300px] rounded-lg cursor-pointer object-cover shadow-md hover:shadow-xl transition-shadow"
						onClick={handleImageClick}
						onError={(e) => {
							e.target.style.display = "none";
							e.target.parentElement.innerHTML =
								'<div class="text-red-500">Failed to load image</div>';
						}}
					/>
					<div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
						{message.fileName || "Image"}
					</div>
				</div>
			) : isVideo ? (
				<div className="max-w-[300px]">
					<video
						controls
						className="w-full rounded-lg shadow-md"
						src={`https://backend2-9yyf.onrender.com/files/${message.fileId}`}
					>
						Your browser does not support the video tag.
					</video>
					<p className="text-xs text-gray-600 mt-1">{message.fileName || "Video"}</p>
				</div>
			) : (
				<div
					className={`file-attachment rounded-lg cursor-pointer transition-all hover:shadow-lg ${
						isSentByCurrentUser ? "hover:bg-blue-400/30" : "hover:bg-gray-200"
					}`}
					style={{ minWidth: "200px", maxWidth: "300px" }}
				>
					<div className="flex items-center gap-3 p-3" onClick={handleDownload}>
						<span className="file-icon text-3xl">{getFileIcon(fileType)}</span>
						<div className="file-info flex-1 min-w-0">
							<div className="file-name text-sm font-medium truncate">
								{message.fileName || "Unnamed file"}
							</div>
							<div className="file-size text-xs text-gray-350">
								{formatFileSize(message.fileSize)}
							</div>
						</div>
						<button className="flex-shrink-0 text-xl hover:scale-110 transition-transform">
							⬇️
						</button>
					</div>

					{/* Summarize button for documents */}
					{canSummarize() && (
						<div className="border-t border-gray-200 p-2">
							<button
								onClick={handleSummarize}
								disabled={summarizing}
								className={`w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
									summarizing
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
								}`}
							>
								{summarizing ? "🤖 Summarizing..." : "🤖 Ask AI to Summarize"}
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default FileMessage;
