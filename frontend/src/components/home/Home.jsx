import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import '../../css/Home.css'

import Banner from './Banner.jsx'
import ISSPosition from './ISSPosition.jsx'
import Quiz from './Quiz.jsx'
import NotFound from '../notfound/NotFound.jsx'

function Home() {

    // State for handling an access to a non existant quiz
    const [notFound, setNotFound] = useState(false);

    /*useEffect(() => {
        document.title = "ISSue - Home";
        setNotFound(false);
    }, [notFound]);

    if (notFound) {
		return <NotFound/>
  	}*/

    return (
        <div id="Home-display">
            <div id="Home-left-display">

            </div>
            <div id="Home-center-display">
                <Banner />
                <ISSPosition />
                <Quiz />
            </div>
            <div id="Home-right-display">

            </div>
        </div>
    )
}

export default Home;