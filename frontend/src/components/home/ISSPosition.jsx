import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';

import Spinner from '../utility/Spinner.jsx';
import RecenterMap from './RecenterMap.jsx'

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
                    const response = await axios.get('/api/external/iss');
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
                    const response = await axios.get('/api/resources/iss/'+encodeURIComponent(ISSQuizDate));
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

    const currentISSLabelColor = currentIsSelected ? "text-gray-500" : "hover:text-gray-400";
    const quizISSLabelColor = currentIsSelected ? "hover:text-gray-400" : "text-gray-500";
  
    const selectedDiv = canShowCurrentPosition ? (
        <div className="grid grid-cols-2">
            <div>
                <h3 className={"text-center cursor-pointer "+currentISSLabelColor}
                    onClick={() => switchToCurrent()}>Current ISS position</h3>
            </div>
            <div>
                <h3 className={"text-center cursor-pointer "+quizISSLabelColor}
                    onClick={() => switchToQuiz()}>Quiz ISS position</h3>
            </div>
        </div>
    ) : (
        <div>
            <h3 className={"text-center cursor-pointer "+quizISSLabelColor}>Quiz ISS position</h3>
        </div>
    );

    // Loader displayed while the position is not yet fetched
    if (loading) {
        return (
            <div id="ISS-display" className="flex flex-col justify-center items-center self-center space-y-4 h-110">
                <Spinner />
                <p className="text-center">🛰️ Tracking ISS position...</p>  
            </div>
        );
    }

    return (
        <div id="ISS-display" className="flex flex-col justify-center items-center self-center space-y-4 h-110">
            {selectedDiv}
            <MapContainer className="w-full rounded-xl h-100" center={currentIsSelected ? ISSCurrentPosition : ISSQuizPosition}  zoom={4}>
                <RecenterMap
                    position={currentIsSelected ? ISSCurrentPosition : ISSQuizPosition}
                    trigger={recenter}
                />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <Marker position={currentIsSelected ? ISSCurrentPosition : ISSQuizPosition}>
                    <Popup>{currentIsSelected ? "🛰️ ISS is here!" : "🛰️ ISS was here!"}</Popup>
                </Marker>
            </MapContainer>
            
        </div>
    )
}

export default ISS_Position;