import axios from "axios";
import { useEffect, useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./zustand/useAuthStore";

const Auth = () => {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const { authName, updateAuthName, isHydrated } = useAuthStore();

	useEffect(() => {
		if (isHydrated && authName) {
			router.replace("/chat");
		}
	}, [authName, isHydrated, router]);

	// Show loading while hydrating
	if (!isHydrated) {
		return (
			<div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	// Don't show auth form if already logged in
	if (authName) {
		return null;
	}

	const signUpFunc = async (event) => {
		event.preventDefault();

		try {
			console.log("username: ", username);
			console.log("password: ", password);
			const res = await axios.post(
				"http://localhost:8081/auth/signup",
				{
					username: username,
					password: password,
				},
				{
					withCredentials: true,
				}
			);

			if (res.data.message === "Username already exists") {
				console.log("Username already exists sending alert");
				alert("Username already exists");
			} else {
				updateAuthName(username);
				router.replace("/chat");
			}
		} catch (error) {
			console.log("Error in signup function : ", error.message);
		}
	};

	const loginFunc = async (event) => {
		event.preventDefault();
		try {
			const res = await axios.post(
				"http://localhost:8081/auth/login",
				{
					username: username,
					password: password,
				},
				{
					withCredentials: true,
				}
			);

			updateAuthName(username);
			router.replace("/chat");
		} catch (error) {
			console.log("Error in login function : ", error.message);
			alert("login failed: ", error.message);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				{/* Header */}
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
						Welcome Back
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Sign in to your account or create a new one
					</p>
				</div>

				{/* Form */}
				<form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
					<div className="space-y-4 rounded-md shadow-sm">
						{/* Username Field */}
						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium leading-6 text-gray-900"
							>
								Username
							</label>
							<div className="mt-2">
								<input
									id="username"
									name="username"
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
									placeholder="Enter your username"
									className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none transition"
								/>
							</div>
						</div>

						{/* Password Field */}
						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium leading-6 text-gray-900"
							>
								Password
							</label>
							<div className="mt-2">
								<input
									id="password"
									name="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									placeholder="Enter your password"
									className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 outline-none transition"
								/>
							</div>
						</div>
					</div>

					{/* Buttons */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={signUpFunc}
							className="flex w-1/2 justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
						>
							Sign Up
						</button>
						<button
							type="button"
							onClick={loginFunc}
							className="flex w-1/2 justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 transition-all"
						>
							Login
						</button>
					</div>
				</form>

				{/* Footer */}
				<p className="mt-4 text-center text-sm text-gray-500">
					By continuing, you agree to our{" "}
					<a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
						Terms of Service
					</a>
				</p>
			</div>
		</div>
	);
};
export default Auth;
