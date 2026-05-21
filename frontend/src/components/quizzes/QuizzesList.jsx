import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../utility/utils";
import ReactCountryFlag from "react-country-flag";
import { Star, ChevronUp, ChevronDown, Pin, PinOff } from 'lucide-react';
import axios from 'axios';

/**
 * Renders a searchable, sortable table of quizzes.
 *
 * Handles :
 * - Search by country / region / date
 * - Sort by multiple columns (date, country, region, responses, score, note)
 * - Pin / unpin quizzes (optimistic UI updates)
 * - Navigation to quiz page or results page
 * - Visual indicators for responded quizzes
 *
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {Array<Object>} props.quizzes List of all quizzes available.
 * @param {Array<number>} props.respondedQuizzes IDs of quizzes already responded by the user.
 * @param {Array<number>} props.pinnedQuizzes IDs of quizzes pinned by the user.
 * @param {(newPinned: number[]) => void} props.setPinnedQuizzes Updates the pinned quizzes list in parent state.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @returns {JSX.Element} a quizzes list with sorting and filtering.
 */
function QuizzesList({connectedId, quizzes, respondedQuizzes, pinnedQuizzes, setPinnedQuizzes, showError}) {
    const navigate = useNavigate();

    /** Entered textual search */
    const [searchText, setSearchText] = useState("");
    /** Entered date search */
    const [searchDate, setSearchDate] = useState("");
    /** Column currently sorted, by default "date" column */
    const [sortColumn, setSortColumn] = useState("date"); // Column currently sorted, by default desc date
    /** Sort direction, "asc" or "desc", by default "desc" (on "date" column) */
    const [sortDirection, setSortDirection] = useState("desc"); // "asc" or "desc"

    /**
     * Pins a quiz optimistically (UI update first, API call after).
     *
     * Behavior:
     * - Adds quiz ID locally immediately
     * - Sends POST request to backend
     * - Rolls back state if request fails
     *
     * @param {number} idQuiz ID of the quiz to pin
     */
    const handlePin = async (idQuiz) => {
        // Immediately add locally the newly pinned quiz id
        setPinnedQuizzes([...pinnedQuizzes, idQuiz]);
        try {
            await axios.post("/api/resources/users/pin", {
                idQuiz
            });
        } catch (error) {
            console.error("Error while pinning:\n", error.response.data);
            showError("Failed to pin the quiz");
            // In case of an error : ROLLBACK
            setPinnedQuizzes(pinnedQuizzes.filter(id => id != idQuiz));
        }
    };

    /**
     * Unpins a quiz optimistically (UI update first, API call after).
     *
     * Behavior:
     * - Removes quiz ID locally immediately
     * - Sends POST request to backend
     * - Rolls back state if request fails
     * 
     * @param {number} idQuiz ID of the quiz to unpin
     */
    const handleUnpin = async (idQuiz) => {
        // Immediately delete locally the unpined quiz id
        setPinnedQuizzes(pinnedQuizzes.filter(id => id != idQuiz));
        try {
            await axios.post("/api/resources/users/unpin", {
                idQuiz
            });
        } catch (error) {
            console.error("Error while unpinning:\n", error.response.data);
            showError("Failed to unpin the quiz");
            // In case of an error : ROLLBACK
            setPinnedQuizzes([...pinnedQuizzes, idQuiz]);
        }
    };

    /**
     * Filters quizzes by search text and date.
     * @returns {Array<Object>} Filtered quizzes list
     */
    const filteredQuizzes = quizzes.filter(quiz => {
        const matchesText = searchText == "" || 
            quiz.country.toLowerCase().includes(searchText.toLowerCase()) ||
            quiz.region.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesDate = searchDate == "" || 
            new Date(quiz.date).toISOString().split("T")[0] == searchDate;
        
        return matchesText && matchesDate;
    });

    /**
     * Changes sorting configuration.
     *
     * If the same column is clicked twice -> toggles asc/desc.
     * Otherwise resets to ascending order.
     *
     * @param {string} column Column key to sort by
     */
    const handleSort = (column) => {
        if (sortColumn === column) {
            // If we click on the same column, the sort direction is reversed
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            // New column sorted : asc order first
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    /**
     * Navigates to quiz page.
     * @param {number} idQuiz Quiz ID
     */
    const goToQuiz = (idQuiz) => {
        navigate("/quiz/"+idQuiz);
    };

    /**
     * Sorts filtered quizzes based on selected column and direction.
     *
     * Sorting rules:
     * - date: newest/oldest based on timestamp
     * - country: alphabetical (case-insensitive)
     * - region: alphabetical (case-insensitive)
     * - responses: number of user responses
     * - score: average score (-1 treated as -Infinity)
     * - note: average user note (-1 treated as -Infinity)
     *
     * Behavior:
     * - Clones filteredQuizzes to avoid mutating state
     * - Dynamically selects comparison key based on sortColumn
     * - Applies ascending or descending order via sortDirection
     */
    const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
        if (!sortColumn) return 0;

        let aValue, bValue;
        switch (sortColumn) {
            case "date":
                aValue = new Date(a.date).getTime();
                bValue = new Date(b.date).getTime();
                break;
            case "country":
                aValue = a.country.toLowerCase();
                bValue = b.country.toLowerCase();
                break;
            case "region":
                aValue = a.region.toLowerCase();
                bValue = b.region.toLowerCase();
                break;
            case "responses":
                aValue = a.userResponses.length;
                bValue = b.userResponses.length;
                break;
            case "score":
                aValue = a.avgScore === -1 ? -Infinity : a.avgScore;
                bValue = b.avgScore === -1 ? -Infinity : b.avgScore;
                break;
            case "note":
                aValue = a.avgUserNote === -1 ? -Infinity : a.avgUserNote;
                bValue = b.avgUserNote === -1 ? -Infinity : b.avgUserNote;
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
    });

    /**
     * Checks if a quiz is pinned by the user currently connected.
     * @param {number} idQuiz Quiz ID
     * @returns {boolean}
     */
    const isPinned = (idQuiz) => {
        return pinnedQuizzes?.includes(idQuiz);
    };

    /**
     * Checks if a quiz has been responded by the user currently connected.
     * @param {number} idQuiz Quiz ID
     * @returns {boolean}
     */
    const isResponded = (idQuiz) => {
        return respondedQuizzes?.includes(idQuiz);
    };

    return (
        <div className="w-full max-w-7xl bg-midissue rounded-2xl shadow-lg p-6 mb-12">
            
            {/* Search bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by country or region..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 
                                 focus:outline-none focus:ring-2 focus:ring-lightissue"
                    />
                </div>
                <div className="md:w-64">
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 
                                 focus:outline-none focus:ring-2 focus:ring-lightissue"
                    />
                </div>
                {(searchText || searchDate) && (
                    <button
                        onClick={() => {
                            setSearchText("");
                            setSearchDate("");
                        }}
                        className="px-4 py-2 bg-peacefullissue hover:bg-darkpeacefullissue text-white 
                                 rounded-lg transition-colors duration-200"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Tab header with sort buttons */}
            <div className="bg-lightissue rounded-t-lg text-white font-semibold">
                <div className="grid grid-cols-7 gap-4 px-4 py-3">
                    <div className="text-center">Action</div>
                    <button 
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                        Date
                        {
                            sortColumn != "date" ? 
                                (<ChevronUp size={16} className="text-gray-400 opacity-50" />)
                            : sortDirection == "asc" ?
                                (<ChevronUp size={16} className="text-white" />)
                                : (<ChevronDown size={16} className="text-white" />)
                        }
                    </button>
                    <button 
                        onClick={() => handleSort('country')}
                        className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                        Country
                        {
                            sortColumn != "country" ? 
                                (<ChevronUp size={16} className="text-gray-400 opacity-50" />)
                            : sortDirection == "asc" ?
                                (<ChevronUp size={16} className="text-white" />)
                                : (<ChevronDown size={16} className="text-white" />)
                        }
                    </button>
                    <button 
                        onClick={() => handleSort('region')}
                        className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                        Region
                        {
                            sortColumn != "region" ? 
                                (<ChevronUp size={16} className="text-gray-400 opacity-50" />)
                            : sortDirection == "asc" ?
                                (<ChevronUp size={16} className="text-white" />)
                                : (<ChevronDown size={16} className="text-white" />)
                        }
                    </button>
                    <button 
                        onClick={() => handleSort('responses')}
                        className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                        N° of responses
                        {
                            sortColumn != "responses" ? 
                                (<ChevronUp size={16} className="text-gray-400 opacity-50" />)
                            : sortDirection == "asc" ?
                                (<ChevronUp size={16} className="text-white" />)
                                : (<ChevronDown size={16} className="text-white" />)
                        }
                    </button>
                    <button 
                        onClick={() => handleSort('score')}
                        className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                        Avg. user score
                        {
                            sortColumn != "score" ? 
                                (<ChevronUp size={16} className="text-gray-400 opacity-50" />)
                            : sortDirection == "asc" ?
                                (<ChevronUp size={16} className="text-white" />)
                                : (<ChevronDown size={16} className="text-white" />)
                        }
                    </button>
                    <button 
                        onClick={() => handleSort('note')}
                        className="flex items-center gap-1 hover:text-gray-200 transition-colors cursor-pointer"
                    >
                        Avg. quiz note
                        {
                            sortColumn != "note" ? 
                                (<ChevronUp size={16} className="text-gray-400 opacity-50" />)
                            : sortDirection == "asc" ?
                                (<ChevronUp size={16} className="text-white" />)
                                : (<ChevronDown size={16} className="text-white" />)
                        }
                    </button>
                </div>
            </div>

            {/* List of quizzes */}
            <div className="bg-[#2a2e50] rounded-b-lg divide-y divide-gray-200 max-h-150 overflow-y-auto">
                {sortedQuizzes.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                        No quizzes found
                    </div>
                ) : (
                    sortedQuizzes.map((quiz) => (
                        <div 
                            key={quiz.idQuiz}
                            className="grid grid-cols-7 gap-4 px-4 py-3
                                     transition-colors duration-150"
                        >

                            {/* Quiz action buttons */}
                            <div className="flex items-center justify-center gap-2">

                                {/* Pin button */}
                                {connectedId != -1 ?
                                    <button
                                        title={isPinned(quiz.idQuiz) ? "Unpin quiz" : "Pin quiz"}
                                        onClick={() => {
                                            isPinned(quiz.idQuiz)
                                                ? handleUnpin(quiz.idQuiz)
                                                : handlePin(quiz.idQuiz);
                                        }}
                                        className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-800/30 transition-colors
                                            flex items-center justify-center group cursor-pointer"
                                    >
                                        {isPinned(quiz.idQuiz) ? (
                                            <>
                                                <Pin className="w-4 h-4 text-orange-400 group-hover:hidden" fill="currentColor" />
                                                <PinOff className="w-4 h-4 text-orange-400 hidden group-hover:block" fill="currentColor" />
                                            </>
                                        ) : (
                                            <Pin className="w-4 h-4 text-orange-400" />
                                        )}
                                    </button>
                                    : null
                                }

                                {/* Navigation button */}
                                <button
                                    onClick={() => goToQuiz(quiz.idQuiz)}
                                    className={`px-4 py-1 rounded-lg transition-all duration-200 
                                            text-sm font-medium cursor-pointer ${
                                        isResponded(quiz.idQuiz)
                                            ? "bg-green-600 hover:bg-green-800 text-white"
                                            : "bg-lightissue hover:bg-[#262841] text-gray-200"
                                    }`}
                                >
                                    {isResponded(quiz.idQuiz) ? "See your results" : "View Quiz"}
                                </button>
                            </div>

                            {/* Quiz date */}
                            <div className="flex items-center text-gray-300">
                                {formatDate(quiz.date)}
                            </div>

                            {/* Quiz country flag */}
                            <div className="flex items-center gap-2">
                                {!quiz.ocean ? 
                                    <ReactCountryFlag 
                                        countryCode={quiz.countryCode}
                                        className = "w-[30%] h-[30%]"
                                        title="US" svg  />
                                    : "🌍"
                                }
                                <span className="text-gray-300">{quiz.country}</span>
                            </div>

                            {/* Quiz region */}
                            <div className="flex items-center text-gray-300">
                                {quiz.region}
                            </div>

                            {/* N° of responses */}
                            <div className="flex items-center text-gray-300">
                                {quiz.userResponses.length}
                            </div>

                            {/* Average score */}
                            <div className="flex items-center text-gray-300">
                                {quiz.avgScore != -1 ? quiz.avgScore.toFixed(2) : ""}
                            </div>

                            {/* Average notes given */}
                            <div className="flex items-center text-gray-300">
                                {    quiz.avgUserNote != -1 ?
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={i < quiz.avgUserNote ? "fill-yellow-400 text-yellow-400" : ""}
                                            />
                                        ))}
                                    </div>
                                    : null
                                }
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Counters */}
            <div className="mt-4 text-center text-white text-sm">
                Showing {filteredQuizzes.length} of {quizzes.length} quizzes
            </div>
        </div>
    );
}

export default QuizzesList;