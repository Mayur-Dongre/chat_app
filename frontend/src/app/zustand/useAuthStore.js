import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
	persist(
		(set) => ({
			authName: "",
			isHydrated: false,
			updateAuthName: (name) => set({ authName: name }),
			clearAuth: () => set({ authName: "" }),
			setHydrated: () => set({ isHydrated: true }),
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHydrated();
			}
		}
	)
);
