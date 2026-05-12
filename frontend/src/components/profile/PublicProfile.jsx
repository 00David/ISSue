import { Star, Rocket, Trophy, Calendar, User } from "lucide-react";

function PublicProfile({ user, quizResponses }) {
    
    const totalQuizzes = quizResponses.length;
    const averageScore = quizResponses.length > 0 
        ? (quizResponses.reduce((acc, q) => {
            const correct = q.responses.filter(r => r.correct).length;
            return acc + correct;
        }, 0) / quizResponses.length).toFixed(1)
        : 0;

    const averageNote = quizResponses.length > 0
        ? (quizResponses.reduce((acc, q) => acc + (q.note || 0), 0) / quizResponses.length).toFixed(1)
        : 0;

    const joinDate = new Date(user.subscribeDate);
    const formattedJoinDate = joinDate.toLocaleDateString("en-US", { 
        month: "long", 
        year: "numeric" 
    });

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
                            <span>Joined {formattedJoinDate}</span>
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
                        <p className="text-3xl font-bold text-white">{averageScore}/10</p>
                    </div>
                </div>

                {/* Average Note */}
                <div className="bg-midissue rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium">Average Note</h3>
                        <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                    key={i}
                                    className="w-4 h-4"
                                    fill={i < Math.round(parseFloat(averageNote)) ? "gold" : "none"}
                                    color={i < Math.round(parseFloat(averageNote)) ? "gold" : "currentColor"}
                                />
                            ))}
                        </div>
                        <p className="text-3xl font-bold text-white">{averageNote}</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-midissue rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                
                {quizResponses.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No quizzes completed yet.</p>
                ) : (
                    <div className="space-y-3">
                        {quizResponses.slice(0, 5).map((quizResponse, index) => {
                            const score = quizResponse.responses.filter(r => r.correct).length;
                            const date = new Date(quizResponse.responseDate);
                            const formattedDate = date
                                ? date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                    })
                                : "Unknown date";

                            return (
                                <div key={index} className="flex items-center justify-between p-4 bg-[#16182e] rounded-lg hover:bg-[#1a1d3a] transition-colors">
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
                                            <p className="text-gray-400 text-sm">{formattedDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <Star
                                                key={i}
                                                className="w-4 h-4"
                                                fill={i < (quizResponse.note || 0) ? "gold" : "none"}
                                                color={i < (quizResponse.note || 0) ? "gold" : "currentColor"}
                                            />
                                        ))}
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
