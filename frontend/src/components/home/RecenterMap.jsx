import { useMap } from "react-leaflet";
import { useEffect } from "react";

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