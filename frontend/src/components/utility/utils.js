// Format date helper
export const formatDate = (dateString) => {
	const date = new Date(dateString);
	return date.toLocaleDateString("en-US", { 
		timeZone: "UTC",
		month: "short",
		day: "numeric",
		year: "numeric"
	});
};