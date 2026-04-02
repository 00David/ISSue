import { useEffect, useState } from 'react';

function Quiz(props) {
    const [quiz,setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div id="Home-quiz-display">
            <p className="text-center">Quiz</p>
        </div>
    )
}

export default Quiz;