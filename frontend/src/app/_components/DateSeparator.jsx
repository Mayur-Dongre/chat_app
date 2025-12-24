import React from "react";
import { getDateLabel } from "../utils/dateUtils";

const DateSeparator = ({ timestamp }) => {
	return (
		<div className="flex items-center justify-center my-4">
			<div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
				{getDateLabel(timestamp)}
			</div>
		</div>
	);
};

export default DateSeparator;
