import { useEffect } from 'react';

import ISSPosition from './ISSPosition.jsx'
import Quiz from '../quiz/Quiz.jsx'
import NotFound from '../notfound/NotFound.jsx'

function Home({connectedId, showError, showInfo}) {

    useEffect(() => {
        document.title = "ISSue - Home";
    }, []);

    const todayDate = new Date().toISOString();
    return (
        <div id="Home-display" className="grid grid-cols-[10%_80%_10%] py-10">
            
            <aside id="Home-left" >
            </aside>

            <div id="Home-center" className="justify-center items-center space-y-10">
                <ISSPosition canShowCurrentPosition={true} ISSQuizDate={todayDate} />
                <Quiz connectedId={connectedId} idQuiz={-1} setQuizDate={null} setNotFound={null} showError={showError} showInfo={showInfo}/>
            </div>

            <aside id="Home-right">
            </aside>
            
        </div>
    )
}

export default Home;