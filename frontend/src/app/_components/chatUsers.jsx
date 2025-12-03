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
				updateChatMsgs(res.data.length !== 0 ? res.data : []);
			} catch (error) {
				console.error("Failed to fetch messages:", error);
				updateChatMsgs([]);
			}
		};

		if (chatReceiver) {
			getMsgs();
		}
	}, [chatReceiver, authName, updateChatMsgs]);

	return (
		<div>
			{users.map((user, index) => (
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
