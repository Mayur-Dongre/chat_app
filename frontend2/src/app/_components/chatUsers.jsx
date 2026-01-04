import React, { useEffect } from "react";
import { useUsersStore } from "../zustand/useUsersStore";
import { useChatReceiverStore } from "../zustand/useChatReceiverStore";
import { useAuthStore } from "../zustand/useAuthStore";
import { useChatMsgsStore } from "../zustand/useChatMsgsStore";
import axios from "axios";

const ChatUsers = ({ userStatus, isReceiverTyping }) => {
	const { users } = useUsersStore();
	const { chatReceiver, updateChatReceiver } = useChatReceiverStore();
	const { authName } = useAuthStore();
	const { updateChatMsgs } = useChatMsgsStore();

	// Function to get initials from username
	const getInitials = (username) => {
		if (!username) return "?";
		const words = username.trim().split(" ");
		if (words.length >= 2) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return username.substring(0, 1).toUpperCase();
	};

	// Function to generate consistent color based on username
	const getAvatarColor = (username) => {
		const colors = [
			"bg-blue-500",
			"bg-green-500",
			"bg-purple-500",
			"bg-pink-500",
			"bg-indigo-500",
			"bg-red-500",
			"bg-yellow-500",
			"bg-teal-500",
			"bg-orange-500",
			"bg-cyan-500",
		];

		const hash = username.split("").reduce((acc, char) => {
			return char.charCodeAt(0) + ((acc << 5) - acc);
		}, 0);

		return colors[Math.abs(hash) % colors.length];
	};

	const setChatReceiver = (user) => {
		// debugger
		updateChatReceiver(user.username);
	};

	useEffect(() => {
		const getMsgs = async () => {
			try {
				const res = await axios.get("https://backend2-9yyf.onrender.com/msgs", {
					params: {
						sender: authName,
						receiver: chatReceiver,
					},
					// withCredentials: true,
				});
				console.log("result : ", res);
				// debugger;
				updateChatMsgs(res?.data.length !== 0 ? res.data : []);
			} catch (error) {
				// debugger
				console.error("Failed to fetch messages:", error);
				updateChatMsgs([]);
			}
		};

		if (chatReceiver) {
			getMsgs();
		}
	}, [chatReceiver, authName, updateChatMsgs]);

	return (
		<div className="h-full bg-white border-r border-gray-200">
			{/* Header */}
			<div className="p-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-blue-500">
				<h2 className="text-lg font-semibold text-white">Contacts</h2>
				<p className="text-sm text-white/80">
					{users.filter((u) => u.username !== authName).length} People
				</p>
			</div>

			{/* Users List */}
			<div className="overflow-y-auto h-[calc(100%-80px)]">
				{users
					?.filter((user) => user.username !== authName)
					.map((user, index) => {
						// debugger;
						const isOnline = userStatus[user.username]?.online || user.username === "AI";
						return (
							<div
								key={index}
								onClick={() => setChatReceiver(user)}
								className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 ${
									chatReceiver === user.username
										? "bg-blue-50 border-l-4 border-l-blue-500"
										: "hover:border-l-4 hover:border-l-blue-200"
								}`}
							>
								<div className="flex items-center gap-3">
									<div className="relative">
										{/* Avatar */}
										<div
											className={`w-12 h-12 rounded-full ${getAvatarColor(
												user.username
											)} flex items-center justify-center flex-shrink-0 shadow-md`}
										>
											<span className="text-white font-semibold text-lg">
												{getInitials(user.username)}
											</span>
										</div>

										{isOnline && (
											<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
										)}
									</div>
									{/* User Info */}
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-gray-900 truncate">{user.username}</p>
										<p className="text-xs text-gray-500">
											{isOnline ? (
												chatReceiver === user.username && isReceiverTyping ? (
													<span className="text-green-600 font-medium">Typing...</span>
												) : (
													<span className="text-green-600 font-medium">Online</span>
												)
											) : (
												"Offline"
											)}
										</p>
									</div>
								</div>
							</div>
						);
					})}

				{/* Empty state */}
				{users?.filter((user) => user.username !== authName).length === 0 && (
					<div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
						<svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						<p className="text-center">No contacts available</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ChatUsers;
