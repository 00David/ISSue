import { useEffect } from 'react';

import ISSPosition from '../iss/ISSPosition.jsx'
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
                <h1 className="text-center">Home page</h1>
                <div className="text-center text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    <p>
                        Welcome to <strong className="text-white">ISSue</strong> — a quiz experience powered by the real-time position of the International Space Station !
                    </p>
                    <p>
                        Each day, a new quiz is generated from the exact location of the ISS above Earth, using its continent, country, region,
                        city, and local area when available. The questions are then created dynamically by AI, focusing on geography, culture,
                        history, and notable facts tied to that specific location.
                    </p>
                </div>
                <ISSPosition canShowCurrentPosition={true} ISSQuizDate={todayDate} />
                <Quiz connectedId={connectedId} idQuiz={-1} setQuizDate={null} setNotFound={null} showError={showError} showInfo={showInfo}/>
            </div>

            <aside id="Home-right">
            </aside>
            
        </div>
    )
}

export default Home;