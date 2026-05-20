import { useNavigate } from "react-router-dom";
import { formatDate } from "../utility/utils";
import { Star, Rocket, Trophy, Calendar, User } from "lucide-react";
import { Link } from 'react-router-dom';

function PublicProfile({user, quizResponses}) {
    const navigate = useNavigate();

    /** Total number of quizzes responded. */
    const totalQuizzes = quizResponses.length;

    /** Average score for quizzes reponded. At most one digit after the decimal point. */
    const averageScore = quizResponses.length > 0 
        ? (quizResponses.reduce((acc, q) => {
            const correct = q.responses.filter(r => r.correct).length;
            return acc + correct;
        }, 0) / quizResponses.length).toFixed(1)
        : 0;
    
    /** Get given notes (a note at 0 = no note given, don't keep it). */
    const validNotes = quizResponses.map(q => q.note).filter(note => note > 0);
    /** Average note given for responded quizzes. */
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
                        <p className="text-3xl font-bold text-white">{totalQuizzes}</p>
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
                            {totalQuizzes > 0 ? averageScore+"/10" : "No data yet"}
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
                
                {quizResponses.length == 0 ? (
                    <p className="text-gray-400 text-center py-8">No quizzes completed yet.</p>
                ) : (
                    <div className="space-y-3">
                        {quizResponses.slice(0, 5).map((quizResponse, index) => {
                            const score = quizResponse.responses.filter(r => r.correct).length;
                            const date = new Date(quizResponse.responseDate);
                            return (
                                <div key={index} className="flex items-center justify-between p-4 bg-[#16182e] rounded-lg hover:bg-[#1a1d3a] transition-colors cursor-pointer"
                                    onClick={() => navigate("/quiz/"+quizResponse.idQuiz)}
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
                                            <p className="text-white font-medium">Quiz #{quizResponse.idQuiz}</p>
                                            <p className="text-gray-400 text-sm">{formatDate(date)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {quizResponse.note > 0 && (
                                            <div className="flex gap-1">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                <Star
                                                    key={i}
                                                    className="w-4 h-4"
                                                    fill={i < quizResponse.note ? "gold" : "none"}
                                                    color={i < quizResponse.note ? "gold" : "currentColor"}
                                                />
                                                ))}
                                            </div>
                                        )}
                                        {quizResponse.comment && (
                                            <span className="text-gray-400 text-sm italic">
                                                "{quizResponse.comment.slice(0, 30)}{quizResponse.comment.length > 30 ? "..." : ""}"
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
