import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import axios from "axios";

import Spinner from "../utility/Spinner.jsx";
import RecenterMap from "./RecenterMap.jsx"

function ISS_Position({canShowCurrentPosition, ISSQuizDate}) {
    const [ISSCurrentPosition,setISSCurrentPosition] = useState([0, 0]); // [latitude, longitude]
    const [ISSQuizPosition,setISSQuizPosition] = useState([0, 0]); // [latitude, longitude]
    const [currentIsSelected, setCurrentIsSelected] = useState(canShowCurrentPosition ? true : false); // true : current ISS position, false : quiz ISS position
    const [loading, setLoading] = useState(true);
    
    const [recenter, setRecenter] = useState(0); //  map recenter trigger

    const switchToCurrent = () => {
        setCurrentIsSelected(true);
        setRecenter(recenter+1)
    }

    const switchToQuiz = () => {
        setCurrentIsSelected(false);
        setRecenter(recenter+1)
    }

    useEffect(() => {

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
                fetchISS(false);
            }, 5000)

            return () => clearInterval(interval) // interval cleanup
        }
        
    }, [canShowCurrentPosition, ISSQuizDate]);

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

            {/* If current ISS poistion is selected : blinking update info */}
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