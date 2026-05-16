import { useEffect, useState, useMemo } from 'react';
import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import axios from 'axios';

import Spinner from '../utility/Spinner.jsx';
import Question from './Question.jsx'
import CompletedQuizPopup from '../popup/CompletedQuizPopup.jsx'

function TodoQuiz({connectedId, quiz, selectedCached, noteCached, commentCached, showResultsCached, 
    onReload, showError, showInfo}) {

    // for each case (= a question) : -1 if no selection, 0, 1, 2, or 3 if selected
    // (index of the response among answers)
    const [selected, setSelected] = useState(selectedCached);
    const [note, setNote] = useState(noteCached); // 0 = no note
    const [comment, setComment] = useState(commentCached);

    const [showResults, setShowResults] = useState(showResultsCached);
    const [showPopup, setShowPopup] = useState(false);

    const [finalScore, setFinalScore] = useState(0);

    const today = useMemo(() => new Date(), []);
    const quizDate = useMemo(() => new Date(quiz.date), [quiz.date]);
    const formattedQuizDate =
        String(quizDate.getDate()).padStart(2, "0") + "/" +
        String(quizDate.getMonth() + 1).padStart(2, "0") + "/" +
        quizDate.getFullYear();
    const isSameDay = (dateA, dateB) => {
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

    const postResponses = async () => {
        if (connectedId == -1) return;

        const responses = quiz.questions.map((question, index) => ({
            numQuestion: question.numQuestion,
            numResponse: selected[index],
            correct: selected[index] == question.indexResponse
        }));

        const payload = {
            idQuiz: quiz.idQuiz,
            idUser: connectedId,
            responses: responses,
            note: note,
            comment: comment
        };

        try {
            await axios.post("/api/resources/quiz-responses",
                payload
            );
            // Quiz cache cleaned
            if (isSameDay(today, quiz.date)) {
                localStorage.removeItem("quiz-home-cache");
            }
            localStorage.removeItem("quiz"+quiz.idQuiz+"-cache");

            setShowPopup(false);
            onReload();
        } catch (error) {
            console.error("Error while posting quiz responses:\n", error.response.data);
            showError("Error while posting quiz responses");
        }
    }

    const nbSelected = () => {
        return selected.reduce((acc, select) => (select != -1) ? acc+1 : acc, 0); 
    }

    const isEverythingSelected = () => {
        return nbSelected() == quiz.questions.length; 
    }

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
                <h3 className="text-center">
                    {
                        isSameDay(today, quizDate) ? "Today's quiz is about ..." 
                        : formattedQuizDate+" quiz was about ..."
                    } 
                </h3>

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