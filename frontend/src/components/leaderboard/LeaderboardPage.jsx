import { useEffect } from 'react';

import Leaderboard from './Leaderboard.jsx'

function LeaderboardPage() {

    useEffect(() => {
        document.title = "ISSue - Leaderboard";
    }, []);

    return (
        <div id="Leaderboard-display" className="grid grid-cols-[10%_80%_10%] py-10">
            
            <aside id="Leaderboard-left" >
            </aside>

            <div id="Leaderboard-center" className="justify-center items-center space-y-10">
                <Leaderboard limitedTo={null}/>
            </div>

            <aside id="Leaderboard-right">
            </aside>
            
        </div>
    )
}

export default LeaderboardPage;