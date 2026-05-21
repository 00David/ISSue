import { useEffect, useState } from 'react';
import ProgressBar from '../utility/ProgressBar.jsx';
import ReactCountryFlag from "react-country-flag";
import api from "../../api/axios";

import Spinner from '../utility/Spinner.jsx';
import Question from './Question.jsx'
import CompletedQuizPopup from '../popup/CompletedQuizPopup.jsx'
import RespondedQuiz from './RespondedQuiz.jsx'
import TodoQuiz from './TodoQuiz.jsx'
import QuizComments from './QuizComments.jsx'

/**
 * Renders the main quiz container component.
 *
 * Handles:
 * - Fetching quiz data (today quiz or specific quiz)
 * - Local cache management (localStorage)
 * - User responses retrieval
 * - Pinned quizzes retrieval
 * - Switching between TodoQuiz and RespondedQuiz views
 * - Displaying quiz comments section
 *
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {number} props.idQuiz Quiz ID (-1 means home/today quiz).
 * @param {(quizDate: Date) => void} [props.setQuizDate] Optional callback to set quiz date externally.
 * @param {(notFound: boolean) => void} [props.setNotFound] Optional callback to trigger 404 state.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @param {(message: string) => void} props.showInfo Function to display an informational message.
 *
 * @returns {JSX.Element} the quiz container component.
 */
function Quiz({connectedId, idQuiz, setQuizDate, setNotFound, showError, showInfo}) {
    const isHome = idQuiz == -1;
    
    /** The quiz to condider */
    const [quiz, setQuiz] = useState(null);
    /** The currently connected user responses to the current quiz. Null if not connected or no responses. */
    const [userResponses, setUserResponses] = useState(null);
     /** Ids of user pinned quizzes. Empty if not connected. */
    const [pinnedQuizzes, setPinnedQuizzes] = useState([]);

    /** Selected responses (got from cache) */
    const [selectedCached, setSelectedCached] = useState([]);
    /** Entered quiz note (got from cache) */
    const [noteCached, setNoteCached] = useState(0);
    /** Entered quiz comment (got from cache) */
    const [commentCached, setCommentCached] = useState("");
    /** Having to show the results (got from cache) */
    const [showResultsCached, setShowResultsCached] = useState(false);

    /** Trigerred when a response has been posted, forced a reload */
    const [forceReload, setForceReload] = useState(false);
    /** Indicates if the currently connected user has responded to the current quiz */
    const [hasResponded, setHasResponded] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        /**
         * Fetch all needed data, including the quiz, the eventuel user responses, and the eventual user pinned quizzes.
         */
        const fetchAllData = async () => {
            setLoading(true);
            
            try {
                // First get the quiz
                const quizData = await getQuiz();
                if (!quizData) {
                    setLoading(false);
                    return;
                }

                // If not connected, stop here
                if (connectedId === -1) {
                    setLoading(false);
                    return;
                }

                // Parallel calls for user datas (independant from the quiz)
                const [responsesData, pinnedData] = await Promise.allSettled([
                    fetchUserResponses(quizData.idQuiz),
                    fetchPinnedQuizzes()
                ]);

                // Treat user responses
                if (responsesData.status === 'fulfilled' && responsesData.value) {
                    setUserResponses(responsesData.value);
                    setHasResponded(true);
                }

                // Treat pinned quizzes
                if (pinnedData.status === 'fulfilled' && pinnedData.value) {
                    setPinnedQuizzes(pinnedData.value);
                }

            } catch (error) {
                console.error("Error during data fetching:", error);
            } finally {
                setForceReload(false);
                setLoading(false);
            }
        };

        /**
         * Retrieves the quiz either from cache or from backend API.
         *
         * Cache rules:
         * - Stored in localStorage (quiz-home-cache or quiz{id}-cache)
         * - Invalid if:
         *   - Expired (based on expiresAt)
         *   - Different quiz/date mismatch
         *
         * If cache is valid:
         * - Restores quiz state
         * - Restores user progress (selected, note, comment, showResults)
         *
         * Otherwise:
         * - Fetches quiz from backend API
         * - Initializes empty answers array
         *
         * @returns {Promise<Object|null>} The quiz object or null if error
         */
        const getQuiz = async () => {
            // Try to get the quiz from the cache
            const cached = isHome ? localStorage.getItem("quiz-home-cache") : localStorage.getItem("quiz"+idQuiz+"-cache");

            if (cached) {
                const parsed = JSON.parse(cached);
                const currentDate = new Date().toDateString();
                const cachedQuizDate = new Date(parsed.quiz.date).toDateString();

                const cacheExpired = Date.now() > parsed.expiresAt;
                const isDifferentQuiz = (currentDate != cachedQuizDate) && (idQuiz != parsed.quiz.idQuiz);

                if (!cacheExpired && !isDifferentQuiz) {
                    setQuiz(parsed.quiz);
                    setSelectedCached(parsed.selected);
                    setNoteCached(parsed.note);
                    setCommentCached(parsed.comment);
                    setShowResultsCached(parsed.showResults);
                    if (setQuizDate != null) setQuizDate(parsed.quiz.date);
                    return parsed.quiz;
                } else {
                    // Remove the cached quiz data if too old, or from a different date
                    localStorage.removeItem("quiz"+parsed.quiz.idQuiz+"-cache");
                    if (isHome) {
                        localStorage.removeItem("quiz-home-cache");
                    }
                }
            }

            // If not in cache, fetch the quiz
            try {
                const todayDate = new Date().toISOString();
                const parameter = isHome ? encodeURIComponent(todayDate) : idQuiz;
                const quizFetched = await api.get("/api/resources/quizzes/"+parameter);

                setQuiz(quizFetched.data);
                setSelectedCached(Array(quizFetched.data.questions.length).fill(-1));
                if (setQuizDate != null) setQuizDate(quizFetched.data.date);
                
                return quizFetched.data;
            } catch (error) {
                console.error("Error while fetching today quiz:\n", error.response?.data);
                if (setNotFound != null) setNotFound(true);
                return null;
            }
        };

        /**
         * Fetches the connected user's responses for a given quiz.
         * If the quiz has not been answered yet, returns null (404 ignored).
         * 
         * @param {number} quizId The quiz ID
         * @returns {Promise<Object|null>} User response object or null
         */
        const fetchUserResponses = async (quizId) => {
            try {
                const fetchedUserResp = await api.get("/api/resources/user-responses?idquiz="+quizId+"&iduser="+connectedId);
                return fetchedUserResp.data;
            } catch (error) {
                // 404 = quiz not yet responded
                if (error.response?.status != 404) {
                    console.error("Error while fetching user responses:\n", error.response?.data);
                }
                return null;
            }
        };

        /**
         * Fetches the list of pinned quizzes for the connected user.
         * 
         * @returns {Promise<number[]>} Array of pinned quiz IDs
         */
        const fetchPinnedQuizzes = async () => {
            try {
                const response = await api.get("/api/resources/users/"+connectedId);
                return response.data.pinnedQuizzes;
            } catch (error) {
                console.error("Error while fetching connected user pinned quizzes:\n", error.response?.data);
                return [];
            }
        };

        fetchAllData();
    }, [isHome, idQuiz, connectedId, setQuizDate, setNotFound, forceReload]);

    /**
     * Forces the component to reload all quiz-related data.
     * Used after submitting a quiz.
     */
    const onReload = () => {
        setLoading(true);
        setForceReload(true);
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
        <>
            {hasResponded ? (
                <RespondedQuiz 
                    connectedId={connectedId}
                    quiz={quiz} 
                    userResponses={userResponses}
                    isHome={isHome}
                    pinnedQuizzes={pinnedQuizzes}
                    setPinnedQuizzes={setPinnedQuizzes}
                    showError={showError}
                />
            ) : (
                <TodoQuiz 
                    connectedId={connectedId} 
                    quiz={quiz} 
                    selectedCached={selectedCached}
                    noteCached={noteCached}
                    commentCached={commentCached}
                    showResultsCached={showResultsCached}
                    onReload={onReload}
                    isHome={isHome}
                    pinnedQuizzes={pinnedQuizzes}
                    setPinnedQuizzes={setPinnedQuizzes}
                    showError={showError} 
                    showInfo={showInfo}
                />
            )}

            {/* Quiz comments */}
            <QuizComments idQuiz={quiz.idQuiz} />
        </>
    );
}

export default Quiz;