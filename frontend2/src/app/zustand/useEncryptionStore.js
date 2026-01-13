import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useEncryptionStore = create(
	persist(
		(set, get) => ({
			publicKey: null,
			privateKey: null,
			userPublicKeys: {},
			conversationKeys: {},

			setKeyPair: (publicKey, privateKey) => set({ publicKey, privateKey }),

			addUserPublicKey: (username, publicKey) =>
				set((state) => ({
					userPublicKeys: { ...state.userPublicKeys, [username]: publicKey },
				})),

			setConversationKey: (conversationId, aesKey) =>
				set((state) => ({
					conversationKeys: { ...state.conversationKeys, [conversationId]: aesKey },
				})),

			getConversationKey: (conversationId) => get().conversationKeys[conversationId],

			clearEncryption: () =>
				set({
					publicKey: null,
					privateKey: null,
					userPublicKeys: {},
					conversationKeys: {},
				}),
		}),

		{
			name: "encryption-storage",
		}
	)
);
