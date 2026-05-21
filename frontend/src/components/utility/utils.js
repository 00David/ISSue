import L from "leaflet";

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

/** Custom icon for map markers */
export const customIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});