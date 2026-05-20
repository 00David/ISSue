import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from "../utility/utils";
import axios from 'axios';
import { MessageSquare, Star, Calendar } from 'lucide-react';

import Spinner from '../utility/Spinner.jsx';

function QuizComments({idQuiz}) {
    const navigate = useNavigate();

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getQuizComments = async () => {
            try {
                const response = await axios.get("/api/resources/quizzes/comments/"+idQuiz);
                setComments(response.data);
            } catch (error) {
                console.error("Error while fetching quiz comments:\n", error.response.data);
            } finally {
                setLoading(false);
            }
        }
        getQuizComments();
    }, [idQuiz]);

    // Star rating display
    const StarRating = ({ note }) => {
        return (
            note > 0 ?
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={16}
                        className={i < note ? "fill-yellow-400 text-yellow-400" : ""}
                    />
                ))}
            </div>
            : null
        );
    };

    {/* Spinner while loading */}
    if (loading) {
        return <div id="Home-quiz-comments" className="flex flex-col gap-4 justify-center 
                    items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto">
                    <Spinner />
                    <p className="text-center">Comments loading...</p>  
                </div>
    }

    if (!comments || comments.length == 0) {
        return <div id="Home-quiz-comments" className="flex flex-col gap-4 justify-center 
                    items-center self-center w-[70%] rounded-xl p-5 bg-midissue mx-auto">
                    <p className="text-gray-400 text-center">No comments for now.</p>
                </div>
    }

    return (
    <div id="Home-quiz-comments" className="flex flex-col gap-4 self-center w-[95%] md:w-[70%] 
            rounded-xl p-4 md:p-6 bg-midissue mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="text-red-500" size={24} />
            <h3 className="text-xl font-bold text-white">
                Comments ({comments.length})
            </h3>
        </div>

        {/* Comments list */}
        <div className="flex flex-col gap-4">
            {comments.map((comment, index) => (
                <div 
                    key={index}
                    className="flex flex-col sm:flex-row gap-4 bg-darkissue rounded-lg p-3 sm:p-4 border border-gray-700"
                >
                    {/* Left section - Avatar and username */}
                    <div className="cursor-pointer flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-3 sm:gap-2 sm:min-w-35 
                        border border-transparent rounded-lg p-2 hover:border-red-500 transition-all duration-300"
                        onClick={() => navigate("/profile/"+comment.idUser)}
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 
                            flex items-center justify-center font-bold text-white shadow-lg text-lg sm:text-xl shrink-0">
                            {comment.username.charAt(0).toUpperCase()}
                        </div>

                        <p className="text-white font-semibold text-left sm:text-center wrap-break-word flex-1 sm:w-full">
                            {comment.username}
                        </p>
                    </div>

                    {/* Vertical separator - hidden on mobile */}
                    <div className="hidden sm:block w-px bg-gray-700"></div>

                    {/* Horizontal separator - visible only on mobile */}
                    <div className="block sm:hidden h-px bg-gray-700"></div>

                    {/* Right section - Comment content */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Date and rating */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Calendar size={14} />
                                <span className="truncate">{formatDate(comment.date)}</span>
                            </div>
                            <StarRating note={comment.note} />
                        </div>

                        {/* Comment text */}
                        <p className="text-gray-300 leading-relaxed wrap-break-word">
                            {comment.comment}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);
}

export default QuizComments;