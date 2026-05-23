import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { customIcon } from "../utility/utils.js"
import api from "../../api/axios";

import Spinner from "../utility/Spinner.jsx";


/**
 * Renders quizzes on an interactive world map using Leaflet.
 *
 * Features:
 * - Fetches ISS positions for each quiz date
 * - Caches map positions in localStorage (10 min TTL)
 * - Displays clustered markers on a world map
 * - Each marker opens a popup with quiz info
 * - Navigation to quiz detail page
 *
 * @param {Array<Object>} props.quizzes List of quizzes to display on the map.
 * @returns {JSX.Element} an interactive map with quiz markers.
 */
function QuizzesMap({quizzes}) {
    const navigate = useNavigate();

    /** Quiz positions map (structure) : date -> {latitude, longitude, quiz infos} */
    const [quizPositionsMap, setQuizPositionsMap] = useState(new Map()); // 

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * Fetches ISS positions for all quizzes and caches the result.
         *
         * - Uses localStorage cache
         * - If cache valid -> loads directly
         * - Otherwise fetches "/api/resources/iss/:date" per quiz
         * - Builds the "quizPositionsMap"
         * - Cache the builded map (as an array because a map is not serializable)
         */
        const fetchQuizzesPositions = async () => {
            const positionsMap = new Map();

            // Try to get the positions from the cache
            const cached = localStorage.getItem("quizzes-positions");
            if (cached) {
                const parsed = JSON.parse(cached);
                const currentDate = new Date().toDateString();
                const cachedDate = new Date(parsed.date).toDateString();

                const cacheExpired = Date.now() > parsed.expiresAt;
                const isDifferentQuizPos = currentDate != cachedDate;

                // Remove the cached quiz data if too old, or from a different date
                if (cacheExpired || isDifferentQuizPos) {
                    localStorage.removeItem("quizzes-positions");
                } else {
                    setQuizPositionsMap(new Map(parsed.positions));
                    setLoading(false);
                    return;
                }
            }

            // If not in cache, fetch the positions
            try {
                for (const quiz of quizzes) {
                    const quizDate = new Date(quiz.date).toISOString();
                    
                    try {
                        const response = await api.get("/api/resources/iss/"+encodeURIComponent(quizDate));
                        positionsMap.set(quizDate, {
                            latitude: parseFloat(response.data.latitude),
                            longitude: parseFloat(response.data.longitude),
                            idQuiz: quiz.idQuiz,
                            country: quiz.country,
                            region: quiz.region,
                            date: quiz.date
                        });
                    } catch (error) {
                        console.error("Error while fetching ISS position for quiz date "+quizDate+" :", error.response?.data);
                    }
                }
                setQuizPositionsMap(positionsMap);

                const todayDate = new Date().toISOString();
                const cache = {
                    positions: Array.from(positionsMap.entries()), // A map is not serializable, so converted to an array
                    date: todayDate,
                    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes,
                };
                localStorage.setItem("quizzes-positions", JSON.stringify(cache));
            } catch (error) {
                console.error("Error while fetching quiz ISS positions:", error);
            } finally {
                setLoading(false);
            }
        };

        if (quizzes.length > 0) {
            fetchQuizzesPositions();
        }
    }, [quizzes]);

    /**
     * Navigates to quiz page.
     * @param {number} idQuiz Quiz ID
     */
    const goToQuiz = (idQuiz) => {
        navigate("/quiz/"+idQuiz);
    };

    {/* Spinner while loading */}
    if (loading) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto">
                <Spinner />
                <p className="text-center text-white">Loading quizzes map...</p>  
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mb-12">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">

                {/* The MAGNIFIQUE MAP */}
                <MapContainer 
                    className="w-full h-150" 
                    center={[20, 0]}
                    zoom={2}
                    maxZoom={18}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                    
                    <MarkerClusterGroup
                        chunkedLoading
                        showCoverageOnHover={false}
                    >
                        {Array.from(quizPositionsMap.values()).map((position) => (
                            <Marker
                                key={position.idQuiz}
                                position={[position.latitude, position.longitude]}
                                icon={customIcon}

                            >
                                <Popup>
                                    <div className="text-center">
                                        <strong className="block text-lg">🛰️ ISS Quiz Position</strong>
                                        <p className="mt-2"><strong>Country:</strong> {position.country}</p>
                                        <p><strong>Region:</strong> {position.region}</p>
                                        <p><strong>Date:</strong> {new Date(position.date).toLocaleDateString("en-GB")}</p>
                                        <button
                                            onClick={() => goToQuiz(position.idQuiz)}
                                            className="mt-3 px-4 py-2 bg-peacefullissue hover:bg-darkpeacefullissue 
                                                     text-white rounded-lg transition-all duration-200 
                                                     text-sm font-medium w-full cursor-pointer"
                                        >
                                            Go to Quiz
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>

            {/* Info text */}
            <div className="mt-4 text-center text-gray-500 text-sm">
                📍 {quizPositionsMap.size} quiz positions displayed • Click on a marker to view the quiz
            </div>
        </div>
    );
}

export default QuizzesMap;