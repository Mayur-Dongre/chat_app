"use client";
import Chat from "../_components/chat.jsx";
import ProtectedRoute from "../_components/protectedRoute.jsx";

export default function ChatPage() {
	return (
		<ProtectedRoute>
			<Chat />
		</ProtectedRoute>
	);
}
