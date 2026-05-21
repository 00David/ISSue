import { useEffect, useState, useMemo } from 'react';
import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import { Pin, PinOff } from 'lucide-react';
import api from "../../api/axios";

import Spinner from '../utility/Spinner.jsx';
import Question from './Question.jsx'
import CompletedQuizPopup from '../popup/CompletedQuizPopup.jsx'

/**
 * Renders the quiz sub-component when the user has NOT yet responded.
 *
 * Handles:
 * - Manage quiz state (selected answers, note, comment)
 * - Handle pin / unpin of quizzes (optimistic UI update)
 * - Cache quiz progress in localStorage
 * - Validate quiz completion
 * - Compute final score
 * - Trigger result popup (CompletedQuizPopup)
 * - Send user responses to backend
 * 
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {Object} props.quiz Quiz object containing questions, metadata, and answers.
 * @param {Array<number>} props.selectedCached Selected responses (got from cache).
 * @param {number} props.noteCached Entered quiz note (got from cache).
 * @param {string} props.commentCached Entered quiz comment (got from cache).
 * @param {boolean} props.showResultsCached Having to show the results (got from cache).
 * @param {() => void} props.onReload Callback to force quiz data reload after submission.
 * @param {Array<number>} props.pinnedQuizzes List of pinned quiz IDs.
 * @param {(newPinned: number[]) => void} props.setPinnedQuizzes Updates pinned quizzes list.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @param {(message: string) => void} props.showInfo Function to display an informational message.
 *
 * @returns {JSX.Element} Rendered quiz interface to complete.
 */
function TodoQuiz({connectedId, quiz, selectedCached, noteCached, commentCached, showResultsCached, 
    onReload, pinnedQuizzes, setPinnedQuizzes, showError, showInfo}) {

    /** For each case (= a question) : -1 if no selection, 0, 1, 2, or 3 if selected. (The index of the selected option) */
    const [selected, setSelected] = useState(selectedCached);
    /** User given note to the quiz, 0 = no note */
    const [note, setNote] = useState(noteCached);
    /** User given comment to the quiz, "" = no comment */
    const [comment, setComment] = useState(commentCached);
    /** Having to display or not the results, at true when quiz responses are validated */
    const [showResults, setShowResults] = useState(showResultsCached);

    /** Show the CompletedQuizPopup component on validation */
    const [showPopup, setShowPopup] = useState(false);

    /** User final score */
    const [finalScore, setFinalScore] = useState(0);

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

    const today = useMemo(() => new Date(), []);
    const quizDate = useMemo(() => new Date(quiz.date), [quiz.date]);
    const formattedQuizDate =
        String(quizDate.getDate()).padStart(2, "0") + "/" +
        String(quizDate.getMonth() + 1).padStart(2, "0") + "/" +
        quizDate.getFullYear();

    /**
     * Compares two dates and checks if they are on the same calendar day.
     * @param {string|Date} a First date
     * @param {string|Date} b Second date
     * @returns {boolean} True if same day
     */
    const isSameDay = (a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return (
            dateA.getFullYear() == dateB.getFullYear() &&
            dateA.getMonth() == dateB.getMonth() &&
            dateA.getDate() == dateB.getDate()
        );
    }

    // Stores in cache the quiz progression
    useEffect(() => {
        if (!quiz) return;

        const cache = {
            quiz,
            selected,
            note,
            comment,
            showResults,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes,
        };

        if (isSameDay(today, quizDate)) {
            localStorage.setItem("quiz-home-cache", JSON.stringify(cache));
        }
        localStorage.setItem("quiz"+quiz.idQuiz+"-cache", JSON.stringify(cache));
    }, [quiz, showResults, selected, note, comment, today, quizDate]);

    /**
     * Sends the completed quiz responses to the backend.
     *
     * Behavior:
     * - Builds payload from selected answers
     * - Computes correctness per question
     * - Sends POST request to /user-responses
     * - Clears localStorage cache on success
     * - Triggers parent reload
     * 
     * @returns {Promise<void>}
     */
    const postResponses = async () => {
        if (connectedId == -1) return;

        const questionsResponses = quiz.questions.map((question, index) => ({
            numQuestion: question.numQuestion,
            numResponse: selected[index],
            correct: selected[index] == question.indexResponse
        }));

        const payload = {
            idQuiz: quiz.idQuiz,
            idUser: connectedId,
            questionsResponses: questionsResponses,
            note: note,
            comment: comment
        };

        try {
            await api.post("/api/resources/user-responses",
                payload
            );
            // Quiz cache cleaned
            if (isSameDay(today, quiz.date)) {
                localStorage.removeItem("quiz-home-cache");
            }
            localStorage.removeItem("quiz"+quiz.idQuiz+"-cache");
            localStorage.removeItem("quizzes"); // ensures that new statistics will be taken into account for the quizzes list

            setShowPopup(false);
            onReload();
        } catch (error) {
            console.error("Error while posting user responses", error);
            showError("Error while posting user responses");
        }
    }

    /**
     * Counts how many answers have been selected.
     * @returns {number} Number of selected answers
     */
    const nbSelected = () => {
        return selected.reduce((acc, select) => (select != -1) ? acc+1 : acc, 0); 
    }

    /**
     * Checks whether all quiz questions have been answered.
     * @returns {boolean} True if all questions are answered
     */
    const isEverythingSelected = () => {
        return nbSelected() == quiz.questions.length; 
    }

    /**
     * Validates the quiz before showing results.
     *
     * Behavior:
     * - Ensures all questions are answered
     * - Computes final score
     * - Opens results popup
     * - Otherwise shows info message
     */
    const handleValidate = () => {
        if (isEverythingSelected()){
            const totalScore = selected.reduce((acc, answerIndex, i) => {
                if (answerIndex == -1) return acc;
                const correctIndex = quiz.questions[i].indexResponse;
                return answerIndex == correctIndex ? acc + 1 : acc;
            }, 0);
            setFinalScore(totalScore);
            setShowResults(true);
            setShowPopup(true)
        } else{
            showInfo("Need to select all responses");
        }
    }

    /**
     * Updates selected answers for a specific question index.
     *
     * @param {number} index Question index
     * @param {number} newSelected Selected answer index
     */
    const setArraySelected = (index, newSelected) => {
        setSelected(
            selected.map((existingSelection, i) => i == index ? newSelected : existingSelection)
        );
    }

    return (
        <div id="Home-quiz-display" className="flex flex-col gap-4 justify-center 
            items-center self-center w-[95%] md:w-[70%] rounded-xl p-5 bg-midissue mx-auto">
            
            <ProgressBar className="sticky top-12 z-1000" now={nbSelected()*10} />
            
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
                            isSameDay(today, quizDate) ? "Today's quiz is about ..." 
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
                            <Question 
                            key={index} 
                            question={question} 
                            showResult={showResults} 
                            selected={selected}
                            setSelected={ (selected) => setArraySelected(index, selected)} />
                         );
                    })}
            </div>
            
            {/* Validate button */}
            <button 
                className="
                    relative
                    group w-max
                    text-white
                    bg-peacefullissue
                    hover:bg-darkpeacefullissue
                    active:scale-[0.98]
                    mt-4
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    shadow-lg
                    transition-all
                    duration-200
                    hover:scale-[1.10]
                    cursor-pointer
                    "
                onClick={ () => handleValidate()}
            >
                Validate
            </button>
            
            {/* Complteted quiz popup, when validated */}
            {showResults ? (
                <CompletedQuizPopup
                    connectedId={connectedId}
                    postResponse={postResponses}
                    showPopup={showPopup}
                    setShowPopup={setShowPopup}
                    score={finalScore}
                    note={note} setNote={setNote}
                    comment={comment} setComment={setComment}
                    showInfo={showInfo}
                />
            ) : null}
        </div>
    );
}

export default TodoQuiz;