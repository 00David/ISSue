import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";

import Spinner from "../utility/Spinner.jsx";
import RecenterMap from "./RecenterMap.jsx"

/**
 * Renders the ISS position component, used both by the home page ans the quiz page.
 * @param {boolean} props.canShowCurrentPosition true if the component can show the current ISS position (like on the home page).
 * @param {Date} props.ISSQuizDate The ISS quiz date (for the ISS quiz position).
 * @returns {JSX.Element} the ISS position component.
 */
function ISS_Position({canShowCurrentPosition, ISSQuizDate}) {
    /** [latitude, longitude] for the current ISS position */
    const [ISSCurrentPosition,setISSCurrentPosition] = useState([0, 0]);

    /** [latitude, longitude] for the quiz ISS position */
    const [ISSQuizPosition,setISSQuizPosition] = useState([0, 0]);

    /** true : current ISS position, false : quiz ISS position */
    const [currentIsSelected, setCurrentIsSelected] = useState(canShowCurrentPosition ? true : false);

    const [loading, setLoading] = useState(true);
    
    /** map recenter trigger */
    const [recenter, setRecenter] = useState(0);

    /** Switch to displaying the current ISS position */
    const switchToCurrent = () => {
        setCurrentIsSelected(true);
        setRecenter(recenter+1)
    }

    /** Switch to displaying the quiz ISS position */
    const switchToQuiz = () => {
        setCurrentIsSelected(false);
        setRecenter(recenter+1)
    }

    useEffect(() => {

        /**
         * Fetch ISS positions (potentially the current position + necessarily the quiz position).
         * @param {boolean} firstLoad This flag indicates indicates when the quiz ISS position must be fetched (only on first load).
         */
        const fetchISS = async (firstLoad) => {

            let fetchError = false;
            // CURRENT ISS (polling)
            if (canShowCurrentPosition) {
                try {
                    const response = await axios.get("/api/external/iss");
                    const { latitude, longitude } = response.data;
                    setISSCurrentPosition([parseFloat(latitude), parseFloat(longitude)]);
                } catch (error) {
                    console.error("Error while fetching current ISS position:\n", error.response?.data);
                    fetchError = true;
                }
            }

            // QUIZ ISS (one shot, on first loading)
            if (firstLoad && ISSQuizDate) {
                try {
                    const response = await axios.get("/api/resources/iss/"+encodeURIComponent(ISSQuizDate));
                    const { latitude, longitude } = response.data;
                    setISSQuizPosition([parseFloat(latitude), parseFloat(longitude)]);
                } catch (error) {
                    console.error("Error while fetching quiz ISS position:\n", error.response?.data);
                    fetchError = true;
                }
            }

            // Display the map
            if (firstLoad && !fetchError) setLoading(false);
        };
        fetchISS(true);

        if (canShowCurrentPosition) {
            // ISS position fetched every 5 seconds (if it can be showed)
            const interval = setInterval(() => {
                fetchISS(false); // first load parameter now only at false
            }, 5000)

            return () => clearInterval(interval) // interval cleanup
        }
        
    }, [canShowCurrentPosition, ISSQuizDate]);

    {/* Spinner on loading */}
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center self-center space-y-4 h-110">
                <Spinner />
                <p className="text-center">🛰️ Tracking ISS position...</p>  
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center items-center self-center space-y-6 h-120">

            {/* ISS position toggle buttons */}
            {canShowCurrentPosition ? (
                <div className="inline-flex bg-midissue rounded-full p-1 shadow-sm">
                    <button
                        title="Switch to current ISS position"
                        onClick={switchToCurrent}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                            currentIsSelected 
                                ? "bg-lightissue text-white shadow-md" 
                                : "text-gray-500"
                        }`}
                    >
                        🛰️ Current position
                    </button>
                    <button
                        title="Switch to quiz ISS position"
                        onClick={switchToQuiz}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                            !currentIsSelected 
                                ? "bg-lightissue text-white shadow-md"
                                : "text-gray-500"
                        }`}
                    >
                        📍 Quiz position
                    </button>
                </div>
            ) : (
                <div className="inline-flex bg-midissue rounded-full px-6 py-2 shadow-sm">
                    <button onClick={switchToQuiz} className="text-sm font-medium text-white cursor-pointer">📍 Quiz position</button>
                </div>
            )}

            {/* ISS Map */}
            <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                <MapContainer 
                    className="w-full h-100" 
                    center={currentIsSelected ? ISSCurrentPosition : ISSQuizPosition}  
                    zoom={4}
                >
                    <RecenterMap
                        position={currentIsSelected ? ISSCurrentPosition : ISSQuizPosition}
                        trigger={recenter}
                    />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={currentIsSelected ? ISSCurrentPosition : ISSQuizPosition}>
                        <Popup>{currentIsSelected ? "🛰️ ISS is here!" : "🛰️ ISS was here!"}</Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* If current ISS poistion is selected : bottom blinking update info */}
            <div className="h-6 flex items-center justify-center">
                {canShowCurrentPosition && currentIsSelected && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span>Updated every 5 seconds</span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ISS_Position;