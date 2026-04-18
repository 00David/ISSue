import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import ISSPosition from './ISSPosition.jsx'
import Quiz from './Quiz.jsx'
import NotFound from '../notfound/NotFound.jsx'

function Home({connected, setConnected}) {

    const todayDate = new Date().toISOString();
    return (
        <div id="Home-display" className="grid grid-cols-[10%_80%_10%] py-10">
            
            <div id="Home-left" >
            </div>

            <div id="Home-center" className="justify-center items-center space-y-10">
                <ISSPosition canShowCurrentPosition={true} ISSQuizDate={todayDate} />
                <Quiz connected={connected} setConnected={setConnected} />
            </div>

            <div id="Home-right">
            </div>
            
        </div>
    )
}

export default Home;