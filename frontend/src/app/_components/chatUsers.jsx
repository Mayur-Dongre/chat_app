import React, { useEffect } from "react";
import { useUsersStore } from "../zustand/useUsersStore";
import { useChatReceiverStore } from "../zustand/useChatReceiverStore";
import { useAuthStore } from "../zustand/useAuthStore";
import { useChatMsgsStore } from "../zustand/useChatMsgsStore";
import axios from "axios";

const ChatUsers = () => {
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
		return username.substring(0, 2).toUpperCase();
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
		updateChatReceiver(user.username);
	};

	useEffect(() => {
		const getMsgs = async () => {
			try {
				const res = await axios.get("http://localhost:8080/msgs", {
					params: {
						sender: authName,
						receiver: chatReceiver,
					},
					withCredentials: true,
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
					{users.filter((u) => u.username !== authName).length} available
				</p>
			</div>
			{users
				.filter((user) => user.username !== authName)
				.map((user, index) => (
					<div
						key={index}
						onClick={() => setChatReceiver(user)}
						className="bg-blue-400 rounded-xl m-3 p-5"
					>
						{user.username}
					</div>
				))}
		</div>
	);
};

export default ChatUsers;
