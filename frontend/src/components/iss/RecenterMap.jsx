import { useMap } from "react-leaflet";
import { useEffect } from "react";

/**
 * RecenterMap is a helper component that imperatively recenters the Leaflet map whenever the `trigger` value changes.
 *
 * It uses the current zoom level and smoothly animates the map to the new position using `map.flyTo`.
 *
 * @param {[number, number]} props.position - The [latitude, longitude] coordinates to recenter the map on.
 * @param {any} props.trigger - A value used to trigger the recentering effect when changed.
 *
 * @returns {null} This component does not render anything.
 */
function RecenterMap({ position, trigger }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [trigger]);

    return null;
}

export default RecenterMap;