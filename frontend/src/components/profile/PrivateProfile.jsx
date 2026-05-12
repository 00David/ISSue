import { useState } from "react";
import { Star, Rocket, Trophy, Calendar, Mail, Lock, User, Edit2, LogOut, Trash2 } from "lucide-react";

function PrivateProfile({user, quizResponses, onLogout, onUpdateUser, onDeleteAccount}) {
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedUsername, setEditedUsername] = useState(user.username);
    const [editedEmail, setEditedEmail] = useState(user.email);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const joinDate = new Date();
    const formattedJoinDate = joinDate.toLocaleDateString("en-US", { 
        month: "long", 
        year: "numeric" 
    });

    const handleSaveChanges = async () => {
        if (newPassword && newPassword !== confirmPassword) {
            alert("Passwords don't match !");
            return;
        }

        const updates = {};
        if (editedUsername !== user.username) updates.username = editedUsername;
        if (editedEmail !== user.email) updates.email = editedEmail;
        if (newPassword) updates.password = newPassword;

        if (Object.keys(updates).length > 0) {
            await onUpdateUser(updates);
            setIsEditing(false);
            setNewPassword("");
            setConfirmPassword("");
        } else {
            setIsEditing(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (showDeleteConfirm) {
            await onDeleteAccount();
        } else {
            setShowDeleteConfirm(true);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            
            {/* Header Card with Edit Options */}
            <div className="bg-linear-to-br from-midissue to-[#1a1d3a] rounded-xl p-8 shadow-lg">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={editedUsername}
                                        onChange={(e) => setEditedUsername(e.target.value)}
                                        className="bg-[#16182e] text-white px-4 py-2 rounded-lg w-full text-2xl font-bold"
                                        placeholder="Username"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        {user.username}
                                    </h1>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-4 h-4" />
                                        <span>Joined {formattedJoinDate}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#4a7ba7] hover:bg-[#304d73] text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Edit Profile
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleSaveChanges}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-800 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedUsername(user.username);
                                        setEditedEmail(user.email);
                                        setNewPassword("");
                                        setConfirmPassword("");
                                    }}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Private Info Display / Edit */}
                {isEditing ? (
                    <div className="space-y-4 bg-[#16182e] rounded-lg p-6">
                        <div>
                            <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                                className="bg-darkissue text-white px-4 py-2 rounded-lg w-full"
                                placeholder="Email"
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                New Password (leave empty to keep current)
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="bg-darkissue text-white px-4 py-2 rounded-lg w-full mb-2"
                                placeholder="New password"
                            />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-darkissue text-white px-4 py-2 rounded-lg w-full"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-6 text-gray-300">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Password: {"•".repeat(20)}</span>
                        </div>
                    </div>
                )}
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
                <h2 className="text-2xl font-bold text-white mb-4">Your Recent Activity</h2>
                
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
                                    <div className="flex items-center gap-4">
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

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                {!showDeleteConfirm ? (
                    <button
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                    </button>
                ) : (
                    <div className="space-y-3">
                        <p className="text-red-400 font-medium">Are you absolutely sure? This action cannot be undone.</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeleteAccount}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                                Yes, delete my account
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PrivateProfile;
