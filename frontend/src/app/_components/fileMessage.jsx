const FileMessage = ({ message, isSentByCurrentUser }) => {
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
		window.open(`http://localhost:8080/files/${message.fileId}`, "_blank");
	};

	const handleImageClick = (e) => {
		e.stopPropagation();
		window.open(`http://localhost:8080/files/${message.fileId}`, "_blank");
	};

	// Safety check - if message is malformed, show error state
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
						src={`http://localhost:8080/files/${message.fileId}`}
						alt={message.fileName}
						className="max-w-[300px] max-h-[300px] rounded-lg cursor-pointer object-cover shadow-md hover:shadow-xl transition-shadow"
						onClick={handleImageClick}
					/>
					<div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
						{message.fileName}
					</div>
				</div>
			) : isVideo ? (
				<div className="max-w-[300px]">
					<video
						controls
						className="w-full rounded-lg shadow-md"
						src={`http://localhost:8080/files/${message.fileId}`}
					>
						Your browser does not support the video tag.
					</video>
					<p className="text-xs text-gray-600 mt-1">{message.fileName}</p>
				</div>
			) : (
				<div
					onClick={handleDownload}
					className={`file-attachment flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
						isSentByCurrentUser
							? "bg-blue-400/20 hover:bg-blue-400/30"
							: "bg-gray-100 hover:bg-gray-200"
					}`}
					style={{ minWidth: "200px", maxWidth: "300px" }}
				>
					<span className="file-icon text-3xl">{getFileIcon(message.fileType)}</span>
					<div className="file-info flex-1 min-w-0">
						<div className="file-name text-sm font-medium truncate">{message.fileName}</div>
						<div className="file-size text-xs text-gray-500">
							{formatFileSize(message.fileSize)}
						</div>
					</div>
					<button className="flex-shrink-0 text-xl hover:scale-110 transition-transform">⬇️</button>
				</div>
			)}
		</div>
	);
};

export default FileMessage;
