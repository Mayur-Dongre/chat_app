// import axios from "axios";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
	persist(
		(set) => ({
			authName: "",
			authToken: "",
			isHydrated: false,
			updateAuthName: (name) => set({ authName: name }),
			updateAuthToken: (token) => set({ authToken: token }),
			clearAuth: () => set({ authName: "", authToken: "" }),
			setHydrated: () => set({ isHydrated: true }),
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHydrated();
			},
		}
	)
);
