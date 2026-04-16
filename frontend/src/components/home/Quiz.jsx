import { useEffect, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import ProgressBar from 'react-bootstrap/ProgressBar';
import ReactCountryFlag from "react-country-flag";
import axios from 'axios';

import Question from './Question.jsx'

function Quiz() {
    
    const [quiz, setQuiz] = useState(null);
    const [selected, setSelected] = useState([]); // for each case (= a question) : -1 if no selection, 0 if wrongly selected, 1 if correctly selected
    const [loading, setLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);

    function nbSelected(){
        return selected.reduce((acc, select) => (select != -1) ? acc+1 : acc, 0); 
    }

    function validate(){
        const isEverythingSelected = selected.reduce((acc, select) => acc && (select != -1), true);

        if (isEverythingSelected){
            setShowResults(true);
            const totalScore = selected.reduce((acc, score) => acc + score, 0); // each score can be only 0 or 1
        } else{
            alert("Need to select everything");
        }
    }

    function setArraySelected(index, newSelected){
        setSelected(
            selected.map((existingSelection, i) => i === index ? newSelected : existingSelection)
        );
    }

    useEffect(() => {
        const fetchTodayQuiz = async () => {
            try {
                const todayDate = new Date().toISOString();
                const response = await axios.get('/api/quizzes/'+encodeURIComponent(todayDate));
                setQuiz(response.data);
                setSelected(Array(response.data.questions.length).fill(-1));
                setLoading(false);
            } catch (error) {
                console.error("Error while fetching today quiz:\n", error);
            }
        };
        fetchTodayQuiz();
    }, []);

    if (loading) {
        return <div id="Home-quiz-display">
                    <Spinner animation="border" role="status" variant="secondary">
                        <span className="visually-hidden">Quiz loading ...</span>
                    </Spinner>
                    <p className="text-center">Quiz loading...</p>  
                </div>
    }

    if (!quiz) {
        return <div id="Home-quiz-display">No quiz available 🌧️.</div>;
    }

    const quizDate = new Date(quiz.date);
    const formattedQuizDate =
        String(quizDate.getDate()).padStart(2, "0") + "/" +
        String(quizDate.getMonth() + 1).padStart(2, "0") + "/" +
        quizDate.getFullYear();
    return (
        <div id="Home-quiz-display">
            <div id="Home-quiz-progress">
                <ProgressBar now={nbSelected()*10} />
            </div>
            <div id="Home-quiz-header">
                <h3 className="text-center">{formattedQuizDate} quiz is about ...</h3>
                {!quiz.ocean && <ReactCountryFlag 
                    countryCode={quiz.countryCode}
                    style={{
                        width: '30%',
                        height: '30%',
                    }}
                    title="US" svg  />}
                <h2 className="text-center">{quiz.country} !</h2>
                {quiz.region && <h3 className="text-center">and its "{quiz.region}" region !</h3>} 
            </div>
            <div id="Home-quiz-questions">
                    {quiz.questions.map((question, index) => {
                         return (
                            <Question key={index} question={question} showResult={showResults} 
                            setSelected={ (selected) => setArraySelected(index, selected)} />
                         );
                    })}
            </div>
            <button 
                onClick={ () => validate()}
                disabled={showResults}>
                Validate
            </button>
        </div>
    );
}

export default Quiz;