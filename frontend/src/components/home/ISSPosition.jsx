import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Spinner } from 'react-bootstrap';
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

        // ISS position fetched every 5 seconds
        const interval = setInterval(() => {
            fetchISSPosition(false);
        }, 5000)

        return () => clearInterval(interval) // interval cleanup
    }, []);

    // Loader displayed while the position is not yet fetched
    if (loading || !ISSPosition) {
        return (
            <div id="Home-iss-position-display">
                <Spinner animation="border" role="status" variant="secondary">
                    <span className="visually-hidden">Loading ...</span>
                </Spinner>
                <p className="text-center">🛰️ Tracking ISS position...</p>  
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