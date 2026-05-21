/**
 * Formats a date string into a US locale readable format (UTC timezone).
 * @param {string} dateString - The input date string (ISO format recommended).
 * @returns {string} The formatted date in "MMM DD, YYYY" format (en-US).
 */
export const formatDate = (dateString) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", { 
		timeZone: "UTC",
		month: "short",
		day: "numeric",
		year: "numeric"
	});
};