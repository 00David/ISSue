import { useEffect, useState } from 'react';
import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import axios from 'axios';

import Spinner from '../utility/Spinner.jsx';
import Question from '../home/Question.jsx'
import CompletedQuizPopup from '../popup/CompletedQuizPopup.jsx'

function TodoQuiz({connected, quiz, 
    selectedCached, noteCached, commentCached, 
    showResultsCached, onReload}) {

    // for each case (= a question) : -1 if no selection, 0, 1, 2, or 3 if selected
    // (index of the response among answers)
    const [selected, setSelected] = useState(selectedCached);
    const [note, setNote] = useState(noteCached); // 0 = no note
    const [comment, setComment] = useState(commentCached);

    const [showResults, setShowResults] = useState(showResultsCached);
    const [showPopup, setShowPopup] = useState(false);

    const [finalScore, setFinalScore] = useState(0);

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
        localStorage.setItem("home-quiz-cache", JSON.stringify(cache));
    }, [quiz, showResults, selected, note, comment]);

    async function postResponses() {
        if (connected == -1) return;

        const responses = quiz.questions.map((question, index) => ({
            numQuestion: question.numQuestion,
            numResponse: selected[index],
            correct: selected[index] === question.indexResponse
        }));

        const payload = {
            idQuiz: quiz.idQuiz,
            idUser: connected,
            responses: responses,
            note: note,
            comment: comment
        };

        try {
            await axios.post("/api/resources/quiz-responses",
                payload
            );
            // Home quiz cache cleaned
            localStorage.removeItem("home-quiz-cache");
            setShowPopup(false);
            onReload();
        } catch (error) {
            console.error("Error while posting quiz responses:\n", error.response.data);
        }
    }

    function nbSelected(){
        return selected.reduce((acc, select) => (select != -1) ? acc+1 : acc, 0); 
    }

    function validate(){
        const isEverythingSelected = selected.reduce((acc, select) => acc && (select != -1), true);

        if (isEverythingSelected){
            const totalScore = selected.reduce((acc, answerIndex, i) => {
                if (answerIndex === -1) return acc;
                const correctIndex = quiz.questions[i].indexResponse;
                return answerIndex === correctIndex ? acc + 1 : acc;
            }, 0);
            setFinalScore(totalScore);
            setShowResults(true);
            setShowPopup(true)

        } else{
            alert("Need to select everything");
        }
    }

    function setArraySelected(index, newSelected){
        setSelected(
            selected.map((existingSelection, i) => i === index ? newSelected : existingSelection)
        );
    }

    const quizDate = new Date(quiz.date);
    const formattedQuizDate =
        String(quizDate.getDate()).padStart(2, "0") + "/" +
        String(quizDate.getMonth() + 1).padStart(2, "0") + "/" +
        quizDate.getFullYear();
    return (
        <div id="Home-quiz-display" className="flex flex-col gap-4 justify-center 
            items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto">
            
            <ProgressBar className="sticky top-12 z-1000" now={nbSelected()*10} />
            
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
                            <Question key={index} question={question} showResult={showResults} 
                            selected={selected}
                            setSelected={ (selected) => setArraySelected(index, selected)} />
                         );
                    })}
            </div>

            <button 
                className="quiz-button"
                onClick={ () => validate()}
                >
                Validate
            </button>
            
            {showResults ? (
                <CompletedQuizPopup
                    connected={connected}
                    postResponse={postResponses}
                    showPopup={showPopup}
                    setShowPopup={setShowPopup}
                    score={finalScore}
                    note={note} setNote={setNote}
                    comment={comment} setComment={setComment}
                />
            ) : null}
        </div>
    );
}

export default TodoQuiz;