import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import ISSPosition from './ISSPosition.jsx'
import Quiz from './Quiz.jsx'
import NotFound from '../notfound/NotFound.jsx'

function Home({connected, setConnected}) {

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
                <Quiz connected={connected} setConnected={setConnected} />
            </div>

            <aside id="Home-right">
            </aside>
            
        </div>
    )
}

export default Home;