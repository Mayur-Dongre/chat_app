export const formatMessageTime = (timestamp) => {
	if (!timestamp) return "";

	try {
		const date = new Date(timestamp);
		if (isNaN(date.getTime())) return ""; // Check if valid date

		const hours = date.getHours();
		const minutes = date.getMinutes();

		// Format as HH:MM
		const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}`;
		return formattedTime;
	} catch (error) {
		console.error("Error formatting time: ", error);
		return "";
	}
};

export const getDateLabel = (timestamp) => {
	if (!timestamp) return "";

	try {
		const messageDate = new Date(timestamp);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		// Reset time to midnight for comparison
		const resetTime = (date) => {
			date.setHours(0, 0, 0, 0);
			return date;
		};

		const messageDateOnly = resetTime(new Date(messageDate));
		const todayOnly = resetTime(new Date(today));
		const yesterdayOnly = resetTime(new Date(yesterday));

		// Check if today
		if (messageDateOnly.getTime() === todayOnly.getTime()) {
			return "Today";
		}

		// Check if yesterday
		if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
			return "Yesterday";
		}

		// Check if within last 6 days
		const sixDaysAgo = new Date(today);
		sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

		if (messageDate >= sixDaysAgo) {
			const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
			return days[messageDate.getDay()];
		}

		// Format as "DD Month" (e.g., "15 December")
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		const day = messageDate.getDate();
		const month = months[messageDate.getMonth()];

		return `${day} ${month}`;
	} catch (error) {
		console.error("Error getting date label: ", error);
		return "";
	}
};

export const shouldShowDateSeparator = (currentMsg, previousMsg) => {
	if (!currentMsg || !currentMsg.timestamp) return false;
	if (!previousMsg || !previousMsg.timestamp) return true; // Show for first message

	try {
		const currentDate = new Date(currentMsg.timestamp);
		const previousDate = new Date(previousMsg.timestamp);

		if (isNaN(currentDate.getTime()) || isNaN(previousDate.getTime())) {
			return false;
		}

		// Reset time to midnight for comparison
		currentDate.setHours(0, 0, 0, 0);
		previousDate.setHours(0, 0, 0, 0);

		return currentDate.getTime() !== previousDate.getTime();
	} catch (error) {
		console.error("Error checking date separator: ", error);
		return false;
	}
};
