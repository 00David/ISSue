import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import { Star } from 'lucide-react';

import Spinner from '../utility/Spinner.jsx';
import Question from './Question.jsx'

function RespondedQuiz({quiz, quizResponses}) {

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
            
            <div id="Home-quiz-header" className="flex flex-col justify-center items-center self-center">
                <h3 className="text-center">{formattedQuizDate} quiz is about ...</h3>
                {!quiz.ocean && <ReactCountryFlag 
                    countryCode={quiz.countryCode}
                    className = "w-[30%] h-[30%]"
                    title="US" svg  />}
                <h2 className="text-center">{quiz.country} !</h2>
                {quiz.region && <h3 className="text-center">and its "{quiz.region}" region !</h3>} 
            </div>

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