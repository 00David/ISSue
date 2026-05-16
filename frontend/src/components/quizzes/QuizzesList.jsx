import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import { Star, ChevronUp, ChevronDown } from 'lucide-react';

function QuizzesList({quizzes, respondedQuizzes}) {
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState("");
    const [searchDate, setSearchDate] = useState("");
    const [sortColumn, setSortColumn] = useState("date"); // Column currently sorted, by default desc date
    const [sortDirection, setSortDirection] = useState("desc"); // "asc" or "desc"

    // Filtering function
    const filteredQuizzes = quizzes.filter(quiz => {
        const matchesText = searchText === "" || 
            quiz.country.toLowerCase().includes(searchText.toLowerCase()) ||
            quiz.region.toLowerCase().includes(searchText.toLowerCase());
        
        const matchesDate = searchDate === "" || 
            new Date(quiz.date).toISOString().split("T")[0] === searchDate;
        
        return matchesText && matchesDate;
    });

    // Sorting function
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

    // Navigation to a quiz
    const goToQuiz = (idQuiz) => {
        navigate("/quiz/"+idQuiz);
    };

    // Apply sorting
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
                aValue = a.respondedQuizzes.length;
                bValue = b.respondedQuizzes.length;
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

    // Format date helper
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { 
            month: "short",
            day: "numeric",
            year: "numeric"
        });
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
                    <div className="text-center">Action</div>
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
                                {quiz.respondedQuizzes.length}
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

                            {/* Quiz navigation button */}
                            <div className="flex items-center justify-center">
                                <button
                                    onClick={() => goToQuiz(quiz.idQuiz)}
                                    className={`px-4 py-1 rounded-lg transition-all duration-200 
                                            text-sm font-medium cursor-pointer ${
                                        respondedQuizzes.includes(quiz.idQuiz)
                                            ? "bg-green-600 hover:bg-green-800 text-white"
                                            : "bg-lightissue hover:bg-[#262841] text-gray-200"
                                    }`}
                                >
                                    {respondedQuizzes.includes(quiz.idQuiz) ? "See your results" : "View Quiz"}
                                </button>
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