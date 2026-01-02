"use client";
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuthStore } from "../zustand/useAuthStore";
import axios from "axios";
import ChatUsers from "./chatUsers";
import { useUsersStore } from "../zustand/useUsersStore";
import { useChatReceiverStore } from "../zustand/useChatReceiverStore";
import { useChatMsgsStore } from "../zustand/useChatMsgsStore";
import { useRouter } from "next/navigation";
import FileUpload from "./fileUpload";
import FileMessage from "./fileMessage";
import DateSeparator from "./DateSeparator";
import { formatMessageTime, shouldShowDateSeparator } from "../utils/dateUtils";
import { authAPI } from "@/config/api";

export const WEB_API_URL = process.env.NEXT_PUBLIC_API_URL;

const Chat = () => {
	const router = useRouter();
	const [msg, setMsg] = useState("");
	const [socket, setSocket] = useState(null);
	const [userStatus, setUserStatus] = useState({});
	const [isReceiverTyping, setIsReceiverTyping] = useState(false);

	const messagesEndRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	const markedAsSeenRef = useRef(new Set());

	const { authName, clearAuth } = useAuthStore();
	const { updateUsers, getAvatarColor, getInitials } = useUsersStore();
	const { chatReceiver, updateChatReceiver } = useChatReceiverStore();
	const { chatMsgs, updateChatMsgs, addChatMsg, updateMsgStatus } = useChatMsgsStore();

	const chatReceiverRef = useRef(chatReceiver);
	const [isBotMessage, setIsBotMessage] = useState(false);
	const [isChatWithAI, setIsChatWithAI] = useState(false);

	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const prevChatMsgsLength = useRef(0);

	// Replace your existing scrollToBottom function with this
	const scrollToBottom = (instant = false) => {
		messagesEndRef.current?.scrollIntoView({
			behavior: instant ? "auto" : "smooth",
		});
	};

	// Replace your existing scroll useEffect with this
	useEffect(() => {
		// Check if this is initial load or chat receiver changed
		if (isInitialLoad || prevChatMsgsLength.current === 0) {
			// Instant scroll for initial load (no animation)
			scrollToBottom(true);
			setIsInitialLoad(false);
		} else if (chatMsgs.length > prevChatMsgsLength.current) {
			// Smooth scroll only when new messages are added
			scrollToBottom(false);
		}

		// Update previous length
		prevChatMsgsLength.current = chatMsgs.length;
	}, [chatMsgs]);

	// Reset initial load flag when chat receiver changes
	useEffect(() => {
		setIsInitialLoad(true);
		prevChatMsgsLength.current = 0;
	}, [chatReceiver]);

	// format last seen time
	const formatLastSeen = (lastSeen) => {
		if (!lastSeen) return "Last seen recently";

		const now = new Date();
		const lastSeenDate = new Date(lastSeen);
		const diffInMinutes = Math.floor((now - lastSeenDate) / 60000);

		if (diffInMinutes < 1) return "Last seen just now";
		if (diffInMinutes < 60) return `Last seen ${diffInMinutes} mins ago`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `Last seen ${diffInHours} hrs ago`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays === 1) return "Last seen yesterday";
		if (diffInDays < 7) return `Last seen ${diffInDays} ago`;

		return `Last seen ${lastSeenDate.toLocaleDateString()}`;
	};

	const getUserData = async () => {
		const res = await authAPI.get("/users");
		updateUsers(res.data);
		console.log("users: ", res.data);
	};

	// Updated function to send conversation history
	const getLLMResponse = async (userMessage) => {
		// Get conversation history for AI chat
		const aiConversation = chatMsgs
			.filter((message) => {
				// Filter messages between current user and AI
				return (
					message.messageType === "text" &&
					((message.sender === authName && message.receiver === "AI") ||
						(message.sender === "AI" && message.receiver === authName))
				);
			})
			.map((message) => ({
				role: message.sender === "AI" ? "assistant" : "user",
				content: message.text,
			}));

		// Add the new user message
		aiConversation.push({
			role: "user",
			content: userMessage,
		});

		console.log("Sending conversation to Lambda: ", aiConversation);
		console.log("WEB_API_URL: ", WEB_API_URL);

		debugger;
		const res = await axios.post(`${WEB_API_URL}testFunction`, {
			conversation: aiConversation,
		});
		return res?.data?.message;
	};

	useEffect(() => {
		setIsReceiverTyping(false);
		chatReceiverRef.current = chatReceiver;
		// Check if chatting with AI
		setIsChatWithAI(chatReceiver === "AI");
		setIsBotMessage(false);
	}, [chatReceiver]);

	useEffect(() => {
		if (!authName) return;

		// Establish WebSocket connection
		const newSocket = io("https://backend-fu0m.onrender.com", {
			query: {
				username: authName,
			},
		});

		// Connection event handlers for debugging
		newSocket.on("connect", () => {
			console.log("Socket connected successfully!", newSocket.id);
			debugger;
		});

		newSocket.on("connect_error", (error) => {
			console.error("Socket connection error:", error.message);
			console.error("Error details:", error);
			debugger;
		});

		newSocket.on("disconnect", (reason) => {
			console.log("Socket disconnected:", reason);
			debugger;
		});

		setSocket(newSocket);

		// Listen for incoming msgs
		newSocket.on("chat msg", (msgrecv) => {
			console.log("received msg object on client " + msgrecv);
			// console.log("chatMsgs before receiving msg : ", chatMsgs);
			useChatMsgsStore.getState().addChatMsg(msgrecv);

			// send delivery ack
			newSocket.emit("msg delivered ack", {
				messageId: msgrecv.messageId,
				sender: msgrecv.sender,
			});

			// using ref to get latest chatReceiver
			// if message is from current chat receiver, mark as seen
			if (msgrecv.sender === chatReceiverRef.current) {
				setTimeout(() => {
					newSocket.emit("msg seen", {
						messageId: msgrecv.messageId,
						sender: msgrecv.sender,
					});
				}, 500);
			}
		});

		// Listen for incoming file messages
		newSocket.on("file msg", (fileMsg) => {
			console.log("received file msg on client ", fileMsg);
			useChatMsgsStore.getState().addChatMsg(fileMsg);

			// send delivery ack
			newSocket.emit("msg delivered ack", {
				messageId: fileMsg.messageId,
				sender: fileMsg.sender,
			});

			// Add seen logic for file messages too
			if (fileMsg.sender === chatReceiverRef.current) {
				setTimeout(() => {
					newSocket.emit("msg seen", {
						messageId: fileMsg.messageId,
						sender: fileMsg.sender,
					});
				}, 500);
			}
		});

		// Listen for message delivered status
		newSocket.on("msg delivered", (data) => {
			console.log("Message Delivered: ", data);
			useChatMsgsStore.getState().updateMsgStatus(data.messageId, "delivered");
		});

		// Listen for msg seen status
		newSocket.on("msg seen", (data) => {
			console.log("Message seen:", data);
			useChatMsgsStore.getState().updateMsgStatus(data.messageId, "seen");
		});

		// Listen for user status updates
		newSocket.on("user status", (status) => {
			console.log("user status update: ", status);
			setUserStatus((prev) => ({
				...prev,
				[status.username]: {
					online: status.online,
					lastSeen: status.lastSeen,
				},
			}));
		});

		// Listen for all users' status
		newSocket.on("all users status", (allStatus) => {
			console.log("All users status: ", allStatus);
			setUserStatus(allStatus);
		});

		// Listen for typing indicator
		newSocket.on("user typing", (data) => {
			console.log("Typing indicator received:", data);
			console.log(`data.sender: ${data.sender}; chatReceiver: ${chatReceiverRef.current}`);

			if (data.sender === chatReceiverRef.current) {
				console.log("Setting typing state to:", data.isTyping);
				setIsReceiverTyping(data.isTyping);
			}
		});

		getUserData();

		// Clean up function
		return () => {
			console.log("Closing socket connection");
			newSocket.close();
		};
	}, [authName]);

	// Clear tracking set when chat receiver changes
	useEffect(() => {
		markedAsSeenRef.current.clear();
	}, [chatReceiver]);

	// Mark msgs as seen when chat receiver changes
	useEffect(() => {
		if (socket && chatReceiver) {
			console.log("Marking messages as seen for:", chatReceiver);

			// Mark all unread messages from this user as seen
			chatMsgs.forEach((msg) => {
				if (
					msg.sender === chatReceiver &&
					msg.receiver === authName &&
					msg.status !== "seen" &&
					!markedAsSeenRef.current.has(msg.messageId)
				) {
					console.log("Marking message as seen:", msg.messageId);
					socket.emit("msg seen", {
						messageId: msg.messageId,
						sender: msg.sender,
					});

					markedAsSeenRef.current.add(msg.messageId);
				}
			});
		}
	}, [chatReceiver, socket, authName, chatMsgs]);

	const sendMsg = async (e) => {
		e.preventDefault();

		if (!msg.trim()) return;

		const messageId = `${Date.now()}-${Math.random()}`;

		// Send user's message first
		let response = null;
		if (isBotMessage) {
			response = await getLLMResponse(msg);
			// debugger;
		}

		const msgToBeSent = response
			? {
					text: `${msg}_ @AI: ${response}`,
					sender: authName,
					receiver: chatReceiver,
					messageType: "text",
					timestamp: new Date().toISOString(),
					status: "sent",
					messageId,
			  }
			: {
					text: msg,
					sender: authName,
					receiver: chatReceiver,
					messageType: "text",
					timestamp: new Date().toISOString(),
					status: "sent",
					messageId,
			  };

		if (socket) {
			// If chatting with AI, get response and save it
			if (isChatWithAI) {
				try {
					const userTxtMessage = {
						text: msg,
						sender: authName,
						receiver: chatReceiver,
						messageType: "text",
						timestamp: new Date().toISOString(),
						status: "sent",
						messageId,
					};

					addChatMsg(userTxtMessage);
					socket.emit("chat msg", userTxtMessage);

					const aiResponse = await getLLMResponse(msg);

					if (aiResponse) {
						const aiMessageId = `${Date.now()}-${Math.random()}`;
						const aiMsgToBeSent = {
							text: aiResponse,
							sender: "AI",
							receiver: authName,
							messageType: "text",
							timestamp: new Date().toISOString(),
							status: "seen", // AI messages are auto-seen
							messageId: aiMessageId,
						};

						// Add AI response to local state
						// addChatMsg(aiMsgToBeSent);

						// Save AI response to database via socket
						socket.emit("chat msg", aiMsgToBeSent);
					}
				} catch (error) {
					console.error("Error getting AI response:", error);
				}
			} else {
				socket.emit("chat msg", msgToBeSent);
				addChatMsg(msgToBeSent);
			}
			setMsg("");

			// Stop typing indicator
			socket.emit("typing", {
				receiver: chatReceiver,
				isTyping: false,
			});
		}
	};

	const handleInputChange = (e) => {
		setMsg(e.target.value);

		// send typing indicator
		if (socket && chatReceiver) {
			socket.emit("typing", {
				receiver: chatReceiver,
				isTyping: true,
			});

			// clear existing timeout
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}

			// stop typing after 3 seconds of no input
			typingTimeoutRef.current = setTimeout(() => {
				socket.emit("typing", {
					receiver: chatReceiver,
					isTyping: false,
				});
			}, 5000);
		}
	};

	const handleDocumentSummary = (summary, fileName) => {
		const summaryMsgId = `${Date.now()}-${Math.random()}`;

		const summaryMessage = {
			text: `📄 **Summary of ${fileName}**\n\n${summary}`,
			sender: "AI",
			receiver: authName,
			messageType: "text",
			timestamp: new Date().toISOString(),
			status: "seen",
			messageId: summaryMsgId,
			isAI: true,
		};

		const summaryMessageAI = {
			text: `@AI: 📄 **Summary of ${fileName}**\n\n${summary}`,
			sender: authName,
			receiver: chatReceiver,
			messageType: "text",
			timestamp: new Date().toISOString(),
			status: "seen",
			messageId: summaryMsgId,
		};

		// Add to local state
		if (!isChatWithAI) {
			addChatMsg(summaryMessageAI);
		}

		// Save to database via socket
		if (socket) {
			isChatWithAI
				? socket.emit("chat msg", summaryMessage)
				: socket.emit("chat msg", summaryMessageAI);
		}
	};

	const handleFileUploaded = (fileMessage) => {
		// add the fileMessage to local state
		addChatMsg(fileMessage);
		console.log("File message added to chat: ", fileMessage);
	};

	const logoutFunc = () => {
		updateChatReceiver("");
		updateChatMsgs([]);
		clearAuth();
		router.replace("/");
	};

	// Get status icon for message
	const getStatusIcon = (status) => {
		switch (status) {
			case "sent":
				return <span className="text-green-500">✓</span>;
			case "delivered":
				return <span className="text-green-500">✓✓</span>;
			case "seen":
				return <span className="text-green-200">✓✓</span>;
			default:
				return null;
		}
	};

	return (
		<div className="h-screen flex divide-x-4">
			<div className="w-1/5">
				<ChatUsers userStatus={userStatus} isReceiverTyping={isReceiverTyping} />
			</div>
			<div className="w-4/5 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
				{/* Header */}
				<div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 shadow-lg">
					{/* First Line: Chat Application and Logout */}
					<div className="flex justify-between items-center mb-3">
						<h1 className="text-xl font-bold">Chat Application</h1>
						<button
							onClick={logoutFunc}
							className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
						>
							Logout
						</button>
					</div>

					{/* Second Line: Avatar and Username */}
					{chatReceiver && (
						<div className="flex items-center gap-3">
							<div className="relative">
								<div
									className={`w-10 h-10 rounded-full ${getAvatarColor(
										chatReceiver
									)} flex items-center justify-center flex-shrink-0 shadow-md`}
								>
									<span className="text-white font-semibold text-sm">
										{getInitials(chatReceiver)}
									</span>
								</div>
								{/* Online Indicator */}
								{(userStatus[chatReceiver]?.online || chatReceiver === "AI") && (
									<div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
								)}
							</div>
							<div>
								<p className="font-semibold text-base">{chatReceiver}</p>
								<p className="text-xs text-white/80">
									{chatReceiver === "AI"
										? "Online"
										: isReceiverTyping
										? "typing..."
										: userStatus[chatReceiver]?.online
										? "Online"
										: formatLastSeen(userStatus[chatReceiver]?.lastSeen)}
								</p>
							</div>
						</div>
					)}
				</div>

				{/* Messages Container */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{chatMsgs.length === 0 ? (
						<div className="flex items-center justify-center h-full">
							{chatReceiver ? (
								<p className="text-gray-400">No messages yet. Start the conversation!</p>
							) : (
								<p className="text-gray-400">Select a contact to start chatting</p>
							)}
						</div>
					) : (
						chatMsgs
							?.filter((message) => {
								// only show msgs between current user & chat receiver
								return (
									message &&
									message.timestamp &&
									((message.sender === authName && message.receiver === chatReceiver) ||
										(message.sender === chatReceiver && message.receiver === authName))
								);
							})
							.map((message, index, filteredArray) => {
								return (
									<React.Fragment key={index}>
										{/* Show date separator if date changed */}
										{shouldShowDateSeparator(message, filteredArray[index - 1]) && (
											<DateSeparator timestamp={message.timestamp} />
										)}

										{/* Message */}
										<div
											className={`flex ${
												message.sender === authName ? "justify-end" : "justify-start"
											}`}
										>
											<div
												className={`max-w-xs lg:max-w-md ${
													message.sender === authName ? "text-right" : "text-left"
												}`}
											>
												{message.messageType === "file" ? (
													<div
														className={`inline-block px-4 py-2 rounded-2xl shadow-md ${
															message.sender === authName
																? "bg-blue-500 text-white rounded-br-none"
																: "bg-white text-gray-800 rounded-bl-none"
														}`}
													>
														{/* // <div className="file-message"> */}
														<FileMessage
															message={message}
															isSentByCurrentUser={message.sender === authName}
															onSummarize={handleDocumentSummary}
														/>
														<div className="flex items-center justify-end gap-1 mt-1">
															<p
																className={`text-xs text-gray-350 mt-1 ${
																	message.sender === authName ? "text-right" : "text-left"
																}`}
															>
																{formatMessageTime(message.timestamp)}
															</p>
															{message.sender === authName && isChatWithAI ? (
																<span className="text-xs">{getStatusIcon("seen")}</span>
															) : (
																message.sender === authName && (
																	<span className="text-xs">{getStatusIcon(message.status)}</span>
																)
															)}
														</div>
													</div>
												) : (
													<div>
														<div
															className={`inline-block px-4 py-2 rounded-2xl shadow-md ${
																message.sender === authName
																	? "bg-blue-500 text-white rounded-br-none"
																	: "bg-white text-gray-800 rounded-bl-none"
															}`}
														>
															<p className="break-words">{message.text}</p>
															<div className="flex items-center justify-end gap-1 mt-1">
																<p
																	className={`text-[10px] mt-1 ${
																		message.sender === authName ? "text-blue-100" : "text-gray-500"
																	}`}
																>
																	{formatMessageTime(message.timestamp)}
																</p>
																{message.sender === authName && isChatWithAI ? (
																	<span className="text-xs">{getStatusIcon("seen")}</span>
																) : (
																	message.sender === authName && (
																		<span className="text-xs">{getStatusIcon(message.status)}</span>
																	)
																)}
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									</React.Fragment>
								);
							})
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
								onChange={handleInputChange}
								placeholder={chatReceiver ? "Type your message..." : "Select a contact first..."}
								disabled={!chatReceiver}
								className="flex-1 px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							/>
							<FileUpload
								sender={authName}
								receiver={chatReceiver}
								socket={socket}
								onFileUploaded={handleFileUploaded}
							/>
							<button
								type="button"
								onClick={() => setIsBotMessage((prev) => !prev)}
								className={`px-8 py-3 text-sm font-semibold rounded-full transition-all transform hover:scale-105 active:scale-95 ${
									isBotMessage || isChatWithAI
										? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
										: "bg-gray-200 text-gray-700 hover:bg-gray-300"
								}`}
							>
								{isChatWithAI ? "🤖 AI On" : isBotMessage ? "🤖 AI On" : "🤖 AI"}
							</button>
							<button
								type="submit"
								disabled={!msg.trim() || !chatReceiver}
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
