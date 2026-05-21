import { useNavigate } from "react-router-dom";
import { formatDate } from "../utility/utils";
import { Star, Rocket, Trophy, Calendar, User } from "lucide-react";
import { Link } from 'react-router-dom';

/**
 * Renders the public profile page of a user.
 * Allows statistics display and recent activity tracking.
 *
 * @param {Object} props.user The current user object.
 * @param {Array<Object>} props.userResponses List of quiz responses from the user.
 *
 * @returns {JSX.Element} the public profile page.
 */
function PublicProfile({user, userResponses}) {
    const navigate = useNavigate();

    /** Total number of user quiz responses */
    const totalUserResponses = userResponses.length;

    /** Average score for user quiz responses. At most one digit after the decimal point. */
    const averageScore = userResponses.length > 0 
        ? (userResponses.reduce((acc, q) => {
            const correct = q.questionsResponses.filter(r => r.correct).length;
            return acc + correct;
        }, 0) / userResponses.length).toFixed(1)
        : 0;
    
    /** Get given notes (a note at 0 = no note given, don't keep it). */
    const validNotes = userResponses.map(q => q.note).filter(note => note > 0);
    /** Average note given for user quiz responses */
    const averageNote = validNotes.length > 0
    ? (validNotes.reduce((acc, note) => acc + note, 0) / validNotes.length).toFixed(1)
    : 0;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            
            {/* Header Card */}
            <div className="bg-linear-to-br from-midissue to-[#1a1d3a] rounded-xl p-8 shadow-lg">
                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* User Info */}
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-white mb-2">
                            {user.username}
                        </h1>
                        <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {formatDate(user.subscribeDate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Quizzes */}
                <div className="bg-midissue rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-blue-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium">Quizzes Completed</h3>
                        <p className="text-3xl font-bold text-white">{totalUserResponses}</p>
                    </div>
                </div>

                {/* Average Score */}
                <div className="bg-midissue rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium">Average Score</h3>
                        <p className="text-3xl font-bold text-white">
                            {totalUserResponses > 0 ? averageScore+"/10" : "No data yet"}
                        </p>
                    </div>
                </div>

                {/* Average Note */}
                <div className="bg-midissue rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium">Average Note</h3>
                        {
                            validNotes.length > 0 ?
                                (<div className="flex">
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <Star
                                            key={i}
                                            className="w-4 h-4"
                                            fill={i < Math.round(parseFloat(averageNote)) ? "gold" : "none"}
                                            color={i < Math.round(parseFloat(averageNote)) ? "gold" : "currentColor"}
                                        />
                                    ))}
                                </div>)
                            : null
                        }
                        <p className="text-3xl font-bold text-white">
                            {validNotes.length > 0 ? averageNote : "No data yet"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-midissue rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                
                {userResponses.length == 0 ? (
                    <p className="text-gray-400 text-center py-8">No quizzes completed yet.</p>
                ) : (
                    <div className="space-y-3">
                        {[...userResponses] // user responses sorted from older to sooner
                            .sort(
                                (a, b) =>
                                    new Date(b.responseDate) -
                                    new Date(a.responseDate)
                            )
                            .slice(0, 5).map((userResponse, index) => {
                            const score = userResponse.questionsResponses.filter(r => r.correct).length;
                            const date = new Date(userResponse.responseDate);
                            return (
                                <div key={index} className="flex items-center justify-between p-4 bg-[#16182e] rounded-lg hover:bg-[#1a1d3a] transition-colors cursor-pointer"
                                    title="Go to quiz"
                                    onClick={() => navigate("/quiz/"+userResponse.idQuiz)}
                                    >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                                            score >= 9 ? "bg-green-500/20 text-green-400" :
                                            score >= 7 ? "bg-blue-500/20 text-blue-400" :
                                            score >= 5 ? "bg-yellow-500/20 text-yellow-400" :
                                            "bg-red-500/20 text-red-400"
                                        }`}>
                                            {score}/10
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Quiz #{userResponse.idQuiz}</p>
                                            <p className="text-gray-400 text-sm">{formatDate(date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {userResponse.note > 0 && (
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                <Star
                                                    key={i}
                                                    className="w-4 h-4"
                                                    fill={i < userResponse.note ? "gold" : "none"}
                                                    color={i < userResponse.note ? "gold" : "currentColor"}
                                                />
                                                ))}
                                            </div>
                                        )}
                                        {userResponse.comment && (
                                            <span className="text-gray-400 text-sm italic">
                                                "{userResponse.comment.slice(0, 30)}{userResponse.comment.length > 30 ? "..." : ""}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PublicProfile;
