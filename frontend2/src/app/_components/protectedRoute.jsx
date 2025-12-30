"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../zustand/useAuthStore";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
	const router = useRouter();
	const { authName, isHydrated } = useAuthStore();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		// Wait for hydration before checking auth
		if (isHydrated) {
			// redirect to login if not authenticated
			if (!authName) {
				router.replace("/");
			}
			setIsChecking(false);
		}
	}, [authName, router, isHydrated]);

	// Don't render children until auth is checked
	if (!isHydrated || isChecking) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
			</div>
		);
	}

	if (!authName) {
		return null;
	}

	return <>{children}</>;
};

export default ProtectedRoute;
