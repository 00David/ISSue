import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import { Star, Pin, PinOff } from 'lucide-react';
import axios from 'axios';

import Spinner from '../utility/Spinner.jsx';
import Question from './Question.jsx'

function RespondedQuiz({connectedId, quiz, quizResponses, isHome, pinnedQuizzes, setPinnedQuizzes, showError}) {

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

    const isPinned = (idQuiz) => {
        return pinnedQuizzes?.includes(idQuiz);
    };

    const selected = quizResponses.responses.map(
        (response) => response.numResponse
    );

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
                {quizResponses.note > 0
                    ? Array.from({ length: 5 }, (_, i) => (
                        <Star
                        key={i}
                        fill={i < quizResponses.note ? "gold" : "none"}
                        color={i < quizResponses.note ? "gold" : "currentColor"}
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
                        quizResponses.comment?.trim()
                        ? quizResponses.comment
                        : "No comment left."
                    }
                </div>
            </div>
        </div>
    );
}

export default RespondedQuiz;