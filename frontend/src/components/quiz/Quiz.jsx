import { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import axios from 'axios';

import Spinner from '../utility/Spinner.jsx';
import Question from '../home/Question.jsx'
import CompletedQuizPopup from '../popup/CompletedQuizPopup.jsx'
import RespondedQuiz from './RespondedQuiz.jsx'
import TodoQuiz from './TodoQuiz.jsx'

function Quiz({connected}) {
    const location = useLocation();
    const isHome = location.pathname === "/";
    const urlIdQuiz = location.pathname.split("/").pop(); // not present if at home
    
    const [quiz, setQuiz] = useState(null);
    const [quizResponses, setQuizResponses] = useState(null);

    const [selectedCached, setSelectedCached] = useState([]);
    const [noteCached, setNoteCached] = useState(0);
    const [commentCached, setCommentCached] = useState("");
    const [showResultsCached, setShowResultsCached] = useState(false);

    const [loading, setLoading] = useState(true);

    const [hasResponded, setHasResponded] = useState(false);

    useEffect(() => {
        const getTodayQuiz = async () => {
            // Try to get the quiz from the cache
            const cached = isHome ? localStorage.getItem("quiz-home-cache") : localStorage.getItem("quiz"+urlIdQuiz+"-cache");

            if (cached) {
                const parsed = JSON.parse(cached);
                const currentDate = new Date().toDateString();
                const cachedQuizDate = new Date(parsed.quiz.date).toDateString();

                const cacheExpired = Date.now() > parsed.expiresAt;
                const isDifferentQuiz = currentDate !== cachedQuizDate;

                // Remove the cached quiz data if too old, or from a different date
                if (cacheExpired || isDifferentQuiz) {
                    if (isHome) {
                        localStorage.removeItem("quiz-home-cache");
                    } else {
                        localStorage.removeItem("quiz"+quiz.idQuiz+"-cache");
                    }
                } else {
                    setQuiz(parsed.quiz);
                    setSelectedCached(parsed.selected);
                    setNoteCached(parsed.note);
                    setCommentCached(parsed.comment);
                    setShowResultsCached(parsed.showResults);
                    return;
                }
            }

            // If not in cache, fetch the quiz
            try {
                const todayDate = new Date().toISOString();
                const quizFetched = await axios.get('/api/resources/quizzes/'+encodeURIComponent(todayDate));
                setQuiz(quizFetched.data);
                setSelectedCached(Array(quizFetched.data.questions.length).fill(-1));
            } catch (error) {
                console.error("Error while fetching today quiz:\n", error.response.data);
            }
        };
        getTodayQuiz();
    }, [isHome]);

    useEffect(() => {
        const fetchQuizResponses = async () => {
            try {
                if (connected === -1 || !quiz) return;
            
                const fetchedQuizResp = await axios.get(
                    "/api/resources/quiz-responses?" +
                    "idquiz=" + quiz.idQuiz +
                    "&iduser=" + connected
                );

                if (fetchedQuizResp.data) {
                    setQuizResponses(fetchedQuizResp.data);
                    setHasResponded(true);
                }

            } catch (error) {
                // 404 = quiz not yet responded
                if (error.response?.status !== 404) {
                    console.error("Error while fetching quiz responses:\n", error.response.data);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchQuizResponses();
    }, [quiz, connected, loading]);

    function onReload() {
        setLoading(true);
    }

    {/* Spinner while loading */}
    if (loading) {
        return <div id="Home-quiz-display" className="flex flex-col gap-4 justify-center 
                    items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto">
                    <Spinner />
                    <p className="text-center">Quiz loading...</p>  
                </div>
    }

    {/* No quiz available */}
    if (!quiz) {
        return <div id="Home-quiz-display" className="flex flex-col gap-4 justify-center 
                    items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto">
                    No quiz available 🌧️.
                </div>;
    }

    {/* Displays either RespondedQuiz or TodoQuiz component, if the user has already responded to that quiz or not */}
    return (
        hasResponded ? (
            <RespondedQuiz 
                quiz={quiz} 
                quizResponses={quizResponses}
            />
        ) : (
            <TodoQuiz 
                connected={connected} 
                quiz={quiz} 
                selectedCached={selectedCached}
                noteCached={noteCached}
                commentCached={commentCached}
                showResultsCached={showResultsCached}
                onReload={onReload}
                isHome={isHome}
            />
        )
    );
}

export default Quiz;