import { create } from "zustand";

export const useUsersStore = create((set) => ({
	users: [],

	updateUsers: (users) => set({ users: users }),
	
	// Function to get initials from username
	getInitials: (username) => {
		if (!username) return "?";
		const words = username.trim().split(" ");
		if (words.length >= 2) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return username.substring(0, 1).toUpperCase();
	},

	// Function to generate consistent color based on username
	getAvatarColor: (username) => {
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
	},
}));
