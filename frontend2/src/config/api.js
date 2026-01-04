import axios from "axios";
import { useAuthStore } from "../app/zustand/useAuthStore.js";

export const AUTH_API_URL =
	process.env.NEXT_PUBLIC_AUTH_API_URL || "https://auth-be-uivq.onrender.com";
export const BACKEND_API_URL =
	process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://backend2-9yyf.onrender.com";

// Create axios instance
export const authAPI = axios.create({
	baseURL: AUTH_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add request interceptor to include token
authAPI.interceptors.request.use(
	(config) => {
		// Get token from Zustand store
		const token = useAuthStore.getState().authToken;

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		debugger;
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Same for backendAPI
export const backendAPI = axios.create({
	baseURL: BACKEND_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

backendAPI.interceptors.request.use(
	(config) => {
		const token = useAuthStore.getState().authToken;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);
