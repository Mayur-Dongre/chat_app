import { useState } from "react";
import axios from "axios";

const FileUpload = ({ sender, receiver, socket, onFileUploaded }) => {
	const [uploading, setUploading] = useState(false);

	const handleFileSelect = async (e) => {
		const file = e.target.files[0];

		if (!file) return;

		// Validate file size
		if (file.size > 5 * 1024 * 1024) {
			alert("File size must be less than 5MB");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);
		formData.append("sender", sender);
		formData.append("receiver", receiver);

		try {
			setUploading(true);
			const response = await axios.post("http://localhost:8080/files/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			console.log("File Uploaded: ", response.data);

			// emit socket event to notify receiver in real time
			if (socket) {
				socket.emit("file msg", response.data.fileMessage);
			}

			// Call callback if provided
			if (onFileUploaded) {
				onFileUploaded(response.data.fileMessage);
			}
		} catch (error) {
			console.error("Upload failed: ", error);
			alert(error.response?.data?.error || "Upload failed");
		} finally {
			setUploading(false);
			// Reset file input
			e.target.value = "";
		}
	};

	return (
		<div className="relative">
			<input
				type="file"
				onChange={handleFileSelect}
				disabled={uploading || !receiver}
				accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,video/*"
				style={{ display: "none" }}
				id="file-input"
			/>
			<label htmlFor="file-input">
				<button
					type="button"
					disabled={uploading || !receiver}
					onClick={() => document.getElementById("file-input").click()}
					className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
				>
					{uploading ? `📤` : "📎"}
				</button>
			</label>
		</div>
	);
};

export default FileUpload;
