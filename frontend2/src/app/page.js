"use client";
import dynamic from "next/dynamic";

const Auth = dynamic(() => import("./auth.jsx"), {
	ssr: false,
	loading: () => <p>Loading...</p>,
});

export default function Home() {
	return (
		<div>
			<Auth />
		</div>
	);
}
