import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

function ISS_Position(props) {
    const [ISSPosition,setISSPosition] = useState([0, 0]); // [latitude, longitude]
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const fetchISSPosition = async (firstLoad) => {
            try {
                const response = await axios.get('/api/get-iss-current-position');
                const { latitude, longitude } = response.data;
                
                // Convertion string to int and update
                setISSPosition([parseFloat(latitude), parseFloat(longitude)]);
                if (firstLoad) setLoading(false);

            } catch (error) {
                console.error("Error while fetching ISS position:\n", error);
            }
        };
        fetchISSPosition(true);

        const interval = setInterval(() => {
            fetchISSPosition(false);
        }, 5000)

        return () => clearInterval(interval) // interval cleanup
    }, []);

    // Loader displayed while the position is not yet fetched
    if (loading || !ISSPosition) {
        return (
            <div id="Home-iss-position-display">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p className="text-center">🛰️ Tracking ISS position...</p>
                </div>
            </div>
        );
    }

    return (
        <div id="Home-iss-position-display">
            <MapContainer id="Home-map" center={ISSPosition}  zoom={4}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={ISSPosition}>
                    <Popup>🛰️ ISS is here!</Popup>
                </Marker>
            </MapContainer>
            <p className="text-center">ISS position</p>
        </div>
    )
}

export default ISS_Position;