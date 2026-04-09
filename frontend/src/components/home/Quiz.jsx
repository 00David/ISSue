import { useEffect, useState } from 'react';
import axios from 'axios';

function Quiz(props) {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const fetchTodayQuiz = async () => {
            try {
                const todayDate = new Date().toISOString();
                const response = await axios.get('/api/quizzes/'+encodeURIComponent(todayDate));
                setQuiz(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error while fetching today quiz:\n", error);
            }
        };
        fetchTodayQuiz();
    }, []);

    if (loading) {
        return <div id="Home-quiz-display">Quiz loading...</div>;
    }

    if (!quiz) {
        return <div id="Home-quiz-display">No quiz available.</div>;
    }

    if (showResults) {
        return (
            <div id="Home-quiz-display">
                <h2>Results</h2>
                <p>Score: {score}/{quiz.questions.length}</p>
                <p>Country/Ocean: {quiz.country}</p>
                {quiz.region && <p>Region: {quiz.region}</p>}
            </div>
        );
    }

    const question = quiz.questions[currentQuestion];

    return (
        <div id="Home-quiz-display">
            <div className="quiz-header">
                <h2>Quiz - {quiz.ocean ? 'Ocean' : 'Country'}: {quiz.country}</h2>
                {quiz.region && <p>Region: {quiz.region}</p>}
                <p>Question {currentQuestion + 1}/{quiz.questions.length}</p>
            </div>

            <div className="quiz-question">
                <h3>{question.question}</h3>
                <div className="quiz-options">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswerClick(index)}
                            className={selectedAnswer === index ? 'selected' : ''}
                            disabled={selectedAnswer !== null}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {selectedAnswer !== null && (
                <div className="quiz-feedback">
                    {selectedAnswer === question.indexResponse ? (
                        <p className="correct">✅ Correct response !</p>
                    ) : (
                        <p className="incorrect">
                            ❌ Incorrect response. The correct response was : {question.options[question.indexResponse]}
                        </p>
                    )}
                    <button onClick={handleNextQuestion}>
                        {currentQuestion < quiz.questions.length - 1 ? 'Next question' : 'See results'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Quiz;