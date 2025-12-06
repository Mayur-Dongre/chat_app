"use client";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuthStore } from "../zustand/useAuthStore";
import axios from "axios";
import ChatUsers from "../_components/chatUsers";
import { useUsersStore } from "../zustand/useUsersStore";
import { useChatReceiverStore } from "../zustand/useChatReceiverStore";
import { useChatMsgsStore } from "../zustand/useChatMsgsStore";

const Chat = () => {
	const [msgs, setMsgs] = useState([]);
	const [msg, setMsg] = useState("");
	const [socket, setSocket] = useState(null);
	const messagesEndRef = useRef(null);
	const { authName } = useAuthStore();
	const { updateUsers } = useUsersStore();
	const { chatReceiver } = useChatReceiverStore();
	const { chatMsgs, updateChatMsgs, addChatMsg } = useChatMsgsStore();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [chatMsgs]);

	const getUserData = async () => {
		const res = await axios.get("http://localhost:8081/users", {
			withCredentials: true,
		});
		updateUsers(res.data);
		console.log("users: ", res.data);
	};

	useEffect(() => {
		// Establish WebSocket connection
		const newSocket = io("http://localhost:8080", {
			query: {
				username: authName,
			},
		});

		setSocket(newSocket);

		// Listen for incoming msgs
		newSocket.on("chat msg", (msgrecv) => {
			console.log("received msg object on client " + msgrecv);
			// console.log("received msg on client " + msgrecv.text);
			console.log("chatMsgs before receiving msg : ", chatMsgs);

			// debugger;
			addChatMsg(msgrecv);
			// updateChatMsgs([...chatMsgs, msgrecv]);
			// setMsgs((prevMsgs) => [...prevMsgs, { text: msgrecv.text, sentByCurrUser: false }]);
			console.log("chatMsgs after receiving msg : ", chatMsgs);
		});

		getUserData();

		// Clean up function
		return () => newSocket.close();
	}, [authName, addChatMsg]);

	const sendMsg = (e) => {
		e.preventDefault();

		const msgToBeSent = {
			text: msg,
			sender: authName,
			receiver: chatReceiver,
		};
		if (socket) {
			socket.emit("chat msg", msgToBeSent);
			console.log("chatMsgs before sending msg : ", chatMsgs);
			// setMsgs((prevMsgs) => [...prevMsgs, { text: msg, sentByCurrUser: true, time }]);
			// updateChatMsgs([...chatMsgs, msgToBeSent]);
			addChatMsg(msgToBeSent);
			setMsg("");
			console.log("chatMsgs after sending msg : ", chatMsgs);
			const now = new Date();
			const time = now.toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			});
		}
	};

	return (
		<div className="h-screen flex divide-x-4">
			<div className="w-1/5">
				<ChatUsers />
			</div>
			<div className="w-4/5 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
				{/* Header */}
				<div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 shadow-lg">
					<h1 className="text-xl font-bold">Chat Application</h1>
					<p className="text-sm opacity-90">Online</p>
					<h1>
						{authName} Chatting with {chatReceiver}
					</h1>
				</div>

				{/* Messages Container */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{chatMsgs.length === 0 ? (
						<div className="flex items-center justify-center h-full">
							<p className="text-gray-400">No messages yet. Start the conversation!</p>
						</div>
					) : (
						chatMsgs?.map((message, index) => (
							<div
								key={index}
								className={`flex ${message.sender === authName ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-xs lg:max-w-md ${
										message.sender === authName ? "text-right" : "text-left"
									}`}
								>
									<div
										className={`inline-block px-4 py-2 rounded-2xl shadow-md ${
											message.sender === authName
												? "bg-blue-500 text-white rounded-br-none"
												: "bg-white text-gray-800 rounded-bl-none"
										}`}
									>
										<p className="break-words">{message.text}</p>
									</div>
									<p
										className={`text-xs text-gray-500 mt-1 ${
											message.sender === authName ? "text-right" : "text-left"
										}`}
									>
										{message?.time}
									</p>
								</div>
							</div>
						))
					)}
					<div ref={messagesEndRef} />
				</div>

				{/* Input Container */}
				<div className="bg-white border-t border-gray-200 p-4 shadow-lg">
					<form onSubmit={sendMsg} className="max-w-4xl mx-auto">
						<div className="flex gap-3">
							<input
								type="text"
								value={msg}
								onChange={(e) => setMsg(e.target.value)}
								placeholder="Type your message..."
								className="flex-1 px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
							/>

							<button
								type="submit"
								disabled={!msg.trim()}
								className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full hover:from-cyan-600 hover:to-blue-600 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
							>
								Send
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Chat;
