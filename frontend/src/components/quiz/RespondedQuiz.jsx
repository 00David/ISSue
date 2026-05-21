import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import { Star, Pin, PinOff } from 'lucide-react';
import api from "../../api/axios";

import Spinner from '../utility/Spinner.jsx';
import Question from './Question.jsx'

/**
 * Renders the quiz sub-component when the user has ALREADY responded.
 * 
 * Shows the quiz content with correct answers, user score, note, and comment.
 * Also allows pinning/unpinning the quiz.
 *
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {Object} props.quiz Quiz object containing questions, metadata, and answers.
 * @param {Object} props.userResponses User responses for the quiz.
 * @param {boolean} props.isHome Whether the quiz is the daily/home quiz.
 * @param {number[]} props.pinnedQuizzes List of pinned quiz IDs.
 * @param {(newPinned: number[]) => void} props.setPinnedQuizzes Updates pinned quizzes list.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * 
 * @returns {JSX.Element} Rendered completed quiz interface.
 */
function RespondedQuiz({connectedId, quiz, userResponses, isHome, pinnedQuizzes, setPinnedQuizzes, showError}) {

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
            await api.post("/api/resources/users/pin", {
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
            await api.post("/api/resources/users/unpin", {
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
     * Indicates if a given quiz is pinned (here it can only be for the current one).
     * @param {nomber} idQuiz the quiz id for which we want to know if he is pinned. 
     * @returns {boolean} True if the given quiz is pinned.
     */
    const isPinned = (idQuiz) => {
        return pinnedQuizzes?.includes(idQuiz);
    };

    /**
     * Extracted selected answers from user responses.
     */
    const selected = userResponses.questionsResponses.map(
        (response) => response.numResponse
    );

    /**
     * Final computed score based on correct answers.
     * @return {number} final computed score based on correct answers
     */
    const finalScore = selected.reduce((acc, answerIndex, i) => {
        if (answerIndex == -1) return acc;
        const correctIndex = quiz.questions[i].indexResponse;
        return answerIndex == correctIndex ? acc + 1 : acc;
    }, 0);

    const quizDate = new Date(quiz.date);
    const formattedQuizDate =
        String(quizDate.getDate()).padStart(2, "0") + "/" +
        String(quizDate.getMonth() + 1).padStart(2, "0") + "/" +
        quizDate.getFullYear();
    return (
        <div id="Home-quiz-display" className="flex flex-col gap-4 justify-center 
            items-center self-center w-[95%] md:w-[70%] rounded-xl p-5 bg-midissue mx-auto">
            
            {/* Quiz infos header */}
            <div id="Home-quiz-header" className="flex flex-col justify-center items-center self-center">

                <div className="flex flex-col items-center gap-3">
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

                    <h3 className="text-center">
                        {
                            isHome ? "Today's quiz is about ..." 
                            : formattedQuizDate+" quiz was about ..."
                        } 
                    </h3>
                </div>

                {!quiz.ocean && <ReactCountryFlag 
                    countryCode={quiz.countryCode}
                    className = "w-[30%] h-[30%]"
                    title="US" svg  />}

                <h2 className="text-center">{quiz.country} !</h2>

                {quiz.region && <h3 className="text-center">and its "{quiz.region}" region !</h3>} 
                
            </div>

            {/* Questions */}
            <div id="Home-quiz-questions">
                    {quiz.questions.map((question, index) => {
                         return (
                            <Question key={index} question={question} 
                                showResult={true} 
                                selected={selected}
                            />
                         );
                    })}
            </div>

            {/* Score */}
            <div id="Home-quiz-score" className="text-center mb-4">
                <h2>Your score :</h2>
                <h1>{finalScore}/10</h1>
            </div>

            {/* Note */}
            <div className="flex flex-col items-center gap-2 mb-4">
                <h2>Given note :</h2>
                <div className="flex gap-1">
                {userResponses.note > 0
                    ? Array.from({ length: 5 }, (_, i) => (
                        <Star
                        key={i}
                        fill={i < userResponses.note ? "gold" : "none"}
                        color={i < userResponses.note ? "gold" : "currentColor"}
                        />
                    ))
                    : "No note left."
                }
                </div>
            </div>

            {/* Comment */}
            <div className="w-full flex flex-col items-center gap-2">
                <h2>Comment :</h2>
                <div className="w-full bg-darkissue rounded-lg p-3 text-gray-200 wrap-break-words text-center">
                    {
                        userResponses.comment?.trim()
                        ? userResponses.comment
                        : "No comment left."
                    }
                </div>
            </div>
        </div>
    );
}

export default RespondedQuiz;