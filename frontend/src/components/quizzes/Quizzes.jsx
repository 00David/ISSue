import { useEffect, useState } from "react";
import axios from "axios";

import Spinner from "../utility/Spinner.jsx";
import QuizzesList from "./QuizzesList.jsx";
import QuizzesMap from "./QuizzesMap.jsx";

function Quizzes({connectedId, showError}) {

    const [quizzes, setQuizzes] = useState([]);
    const [respondedQuizzes, setRespondedQuizzes] = useState([]); // ids of user responded quizzes, filled only when connected
    const [pinnedQuizzes, setPinnedQuizzes] = useState([]); // ids of user pinned quizzes, filled only when connected
    const [selectedView, setSelectedView] = useState("list"); // "list" or "map"
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "ISSue - Quizzes";

        const fetchQuizzes = async () => {

            let gotQuizFromCache = false;
            
            // Try to get the quizzes from the cache
            const cached = localStorage.getItem("quizzes");
            if (cached) {
                const parsed = JSON.parse(cached);
                const currentDate = new Date().toDateString();
                const cachedDate = new Date(parsed.date).toDateString();

                const cacheExpired = Date.now() > parsed.expiresAt;
                const isDifferentQuizList = currentDate != cachedDate;

                // Remove the cached quiz data if too old, or from a different date
                if (cacheExpired || isDifferentQuizList) {
                    localStorage.removeItem("quizzes");
                } else {
                    setQuizzes(parsed.quizzes);
                    gotQuizFromCache = true;
                }
            }

            // If not in cache, fetch the quizzes
            if (!gotQuizFromCache) {
                try {
                    const response = await axios.get("/api/resources/quizzes?stats=true");
                    setQuizzes(response.data);
                    
                    const todayDate = new Date().toISOString();
                    const cache = {
                        quizzes: response.data,
                        date: todayDate,
                        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes,
                    };
                    localStorage.setItem("quizzes", JSON.stringify(cache));
                } catch (error) {
                    console.error("Error while fetching quizzes:\n", error.response?.data);
                }
            }

            if (connectedId == -1) { // Not connected : don't fetch user id and stop here
                setLoading(false);
            }
        };
        fetchQuizzes();

        const fetchUserData = async () => {
            try {
                const response = await axios.get("/api/resources/users/"+connectedId);
                setRespondedQuizzes(response.data.respondedQuizzes);
                setPinnedQuizzes(response.data.pinnedQuizzes);
            } catch (error) {
                console.error("Error while fetching connected user quizzes infos:\n", error.response?.data);
            } finally {
                setLoading(false);
            }
        };
        if (connectedId != -1) { // If the user is connected : its responded quizzes ids are fetched
            fetchUserData();
        }
    }, [connectedId]);

    // Spinner while loading
    if (loading) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto mt-10">
                <Spinner />
                <p className="text-center text-white">Quizzes loading...</p>  
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center self-center w-[90%] mx-auto mt-10 space-y-6">
            
            {/* Showing toggle buttons */}
            <div className="inline-flex bg-midissue rounded-full p-1 shadow-sm">
                <button
                    title="Switch to quizzes list"
                    onClick={() => setSelectedView("list")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                        selectedView === "list"
                            ? "bg-lightissue text-white shadow-md" 
                            : "text-gray-500"
                    }`}
                >
                    📋 List View
                </button>
                <button
                    title="Switch to quizzes map"
                    onClick={() => setSelectedView("map")}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                        selectedView === "map"
                            ? "bg-lightissue text-white shadow-md" 
                            : "text-gray-500"
                    }`}
                >
                    🗺️ Map View
                </button>
            </div>

            {/* Affichage conditionnel */}
            {selectedView === "list" ? (
                <QuizzesList 
                    connectedId={connectedId}
                    quizzes={quizzes} 
                    respondedQuizzes={respondedQuizzes}
                    pinnedQuizzes={pinnedQuizzes}
                    setPinnedQuizzes={setPinnedQuizzes}
                    showError={showError}
                />
            ) : (
                <QuizzesMap 
                    quizzes={quizzes} 
                />
            )}
        </div>
    );
}

export default Quizzes;