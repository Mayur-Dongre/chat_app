import { create } from "zustand";

export const useChatMsgsStore = create((set) => ({
	chatMsgs: [],

	updateChatMsgs: (chatMsgs) => set({ chatMsgs }),

	addChatMsg: (newMsg) =>
		set((state) => ({
			chatMsgs: [...state.chatMsgs, newMsg],
		})),

	updateMsgStatus: (messageId, status) =>
		set((state) => ({
			chatMsgs: state.chatMsgs.map((msg) => {
				return msg.messageId === messageId ? { ...msg, status } : msg;
			}),
		})),

	clearChatMsgs: () => set({ chatMsgs: [] }),
}));
