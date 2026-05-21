import { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";

import ISSPosition from '../iss/ISSPosition.jsx'
import Quiz from './Quiz.jsx'
import NotFound from '../notfound/NotFound.jsx'

/**
 * Renders a specific quiz page.
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @param {(message: string) => void} props.showInfo Function to display an informational message.
 * @returns {JSX.Element} the quiz page.
 */
function QuizPage({connectedId, showError, showInfo}) {
    const location = useLocation();
    const urlIdQuiz = location.pathname.split("/").pop(); // get the quiz id from the URL

    /** Quiz date */
    const [quizDate, setQuizDate] = useState(null);
    
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        document.title = "ISSue - Quiz"+urlIdQuiz;
    }, [urlIdQuiz]);

    if (notFound) {
        return <NotFound />;
    }

    return (
        <div id="Quiz-display" className="grid grid-cols-[10%_80%_10%] py-10">
            
            <aside id="Quiz-left" >
            </aside>

            <div id="Quiz-center" className="justify-center items-center space-y-10">
                <h1 className="text-center">Quiz page</h1>
                {quizDate && <ISSPosition canShowCurrentPosition={false} ISSQuizDate={quizDate} />}
                <Quiz connectedId={connectedId} idQuiz={urlIdQuiz} setQuizDate={setQuizDate} setNotFound={setNotFound} showError={showError} showInfo={showInfo}/>
            </div>

            <aside id="Quiz-right">
            </aside>
            
        </div>
    )
}

export default QuizPage;