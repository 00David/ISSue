import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Medal } from "lucide-react";
import axios from "axios";
import Spinner from "../utility/Spinner.jsx";

/**
 * Renders the ISSue leaderboard.
 * @returns {JSX.Element} the leaderboard component.
 */
function Leaderboard() {
    const navigate = useNavigate();

    /** Array of leaderboard users infos */
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * Fetch the array of leaderboard users infos.
         */
        const fetchLeaderboard = async () => {
            try {
                const response = await axios.get("/api/resources/users/leaderboard");
                setUsers(response.data);
            } catch (error) {
                console.error("Error while fetching leaderboard:\n", error.response?.data);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, []);

    /**
     * Navigates to a user profile page.
     * @param {number} idUser The profile to which we want to navigate.
     */
    const goToUser = (idUser) => {
        navigate("/profile/"+idUser);
    };

    /**
     * Get Medal or Trophy component based on rank.
     * @param {number} rank The rank of a user.
     * @returns A Trophy component for the 1st place, a Medal for 2nd/3rd places, otherwise null.
     */
    const getMedalIcon = (rank) => {
        switch(rank) {
            case 1:
                return <Trophy className="text-yellow-400" size={32} />;
            case 2:
                return <Medal className="text-gray-400" size={28} />;
            case 3:
                return <Medal className="text-amber-600" size={28} />;
            default:
                return null;
        }
    };

    /**
     * Get podium height class based on rank.
     * @param {number} rank The rank of a user.
     * @returns A height adapted to the given user's rank. Higher ranks have higher height.
     */
    const getPodiumHeight = (rank) => {
        switch(rank) {
            case 1:
                return "h-48";
            case 2:
                return "h-36";
            case 3:
                return "h-28";
            default:
                return "h-20";
        }
    };

    {/* Spinner on loading */}
    if (loading) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto mt-10">
                <Spinner />
                <p className="text-center text-white">Loading leaderboard...</p>  
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="flex flex-col gap-4 justify-center items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto mt-10">
                <p className="text-center text-white">No users in leaderboard yet</p>  
            </div>
        );
    }

    const top3 = users.slice(0, 3);
    const restOfUsers = users.slice(3);

    return (
        <div className="w-full max-w-6xl mx-auto mt-10 mb-12">
            
            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    <Trophy className="text-yellow-400" size={40} />
                    Leaderboard
                    <Trophy className="text-yellow-400" size={40} />
                </h1>
                <p className="text-gray-300">Top performers on <strong className="text-white">ISSue</strong></p>
            </div>

            {/* Podium for Top 3 */}
            {top3.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-end justify-center gap-4 px-4">
                        
                        {/* 2nd Place */}
                        {top3[1] && (
                            <div 
                                title="Go to profile"
                                onClick={() => goToUser(top3[1].idUser)}
                                className="flex flex-col items-center cursor-pointer group flex-1 max-w-xs"
                            >
                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-200">
                                    {getMedalIcon(2)}
                                </div>
                                <div className="text-center mb-2">
                                    <div className="text-2xl font-bold text-white mb-1">
                                        {top3[1].username}
                                    </div>
                                    <div className="text-lg text-gray-300">
                                        {top3[1].totalScore} points
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {top3[1].nbQuizResponded} quizzes
                                    </div>
                                </div>
                                <div className={`${getPodiumHeight(2)} w-full bg-linear-to-t from-gray-400 to-gray-300 
                                              rounded-t-xl flex items-center justify-center
                                              group-hover:from-gray-400 group-hover:to-gray-500 transition-all duration-200
                                              shadow-lg`}>
                                    <span className="text-6xl font-bold text-white opacity-50">2</span>
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {top3[0] && (
                            <div 
                                title="Go to the BEST profile"
                                onClick={() => goToUser(top3[0].idUser)}
                                className="flex flex-col items-center cursor-pointer group flex-1 max-w-xs"
                            >
                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-200 
                                              animate-bounce">
                                    {getMedalIcon(1)}
                                </div>
                                <div className="text-center mb-2">
                                    <div className="text-3xl font-bold text-yellow-400 mb-1">
                                        {top3[0].username}
                                    </div>
                                    <div className="text-xl text-white">
                                        {top3[0].totalScore} points
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        {top3[0].nbQuizResponded} quizzes
                                    </div>
                                </div>
                                <div className={`${getPodiumHeight(1)} w-full bg-linear-to-t from-yellow-500 to-yellow-300 
                                              rounded-t-xl flex items-center justify-center
                                              group-hover:from-yellow-400 group-hover:to-yellow-600 transition-all duration-200
                                              shadow-xl`}>
                                    <span className="text-7xl font-bold text-white opacity-50">1</span>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {top3[2] && (
                            <div 
                                title="Go to profile"
                                onClick={() => goToUser(top3[2].idUser)}
                                className="flex flex-col items-center cursor-pointer group flex-1 max-w-xs"
                            >
                                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-200">
                                    {getMedalIcon(3)}
                                </div>
                                <div className="text-center mb-2">
                                    <div className="text-xl font-bold text-white mb-1">
                                        {top3[2].username}
                                    </div>
                                    <div className="text-lg text-gray-300">
                                        {top3[2].totalScore} points
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {top3[2].nbQuizResponded} quizzes
                                    </div>
                                </div>
                                <div className={`${getPodiumHeight(3)} w-full bg-linear-to-t from-amber-700 to-amber-500 
                                              rounded-t-xl flex items-center justify-center
                                              group-hover:from-amber-600 group-hover:to-amber-700 transition-all duration-200
                                              shadow-lg`}>
                                    <span className="text-5xl font-bold text-white opacity-50">3</span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Rest of the leaderboard */}
            {restOfUsers.length > 0 && (
                <div className="bg-midissue rounded-2xl shadow-lg p-6">

                    <div className="space-y-2">
                        {restOfUsers.map((user, index) => {
                            const rank = index + 4; // Starting from 4th place

                            {/* For each next user */}
                            return (
                                <div
                                    key={user.idUser}
                                    title="Go to profile"
                                    onClick={() => goToUser(user.idUser)}
                                    className="flex items-center justify-between px-6 py-4 bg-[#16182e]
                                             rounded-lg hover:bg-[#1a1d3a] transition-all duration-200 
                                             cursor-pointer group"
                                >

                                    <div className="flex items-center gap-6 flex-1">
                                        {/* User rank */}
                                        <div className="text-2xl font-bold text-gray-400 w-12">
                                            #{rank}
                                        </div>

                                        {/* User avar and username */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 
                                                flex items-center justify-center font-bold text-white shadow-lg text-lg sm:text-xl shrink-0">
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-lg font-semibold text-white">
                                                {user.username}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        {/* User total score */}
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-yellow-400">
                                                {user.totalScore}
                                            </div>
                                            <div className="text-xs text-gray-400">points</div>
                                        </div>

                                        {/* User number of responded quizzes */}
                                        <div className="text-right">
                                            <div className="text-lg text-gray-300">
                                                {user.nbQuizResponded}
                                            </div>
                                            <div className="text-xs text-gray-400">quizzes</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            )}
        </div>
    );
}

export default Leaderboard;