import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../utility/utils";
import { Link } from 'react-router-dom';
import { Star, Rocket, Trophy, Calendar, Mail, Lock, User, Edit2, LogOut, Trash2, Pin, PinOff } from "lucide-react";

/**
 * Renders the private profile page of the connected user.
 * Allows profile editing, password update, account deletion,
 * statistics display, pinned quizzes management, and recent activity tracking.
 *
 * @param {Object} props.user The current user object.
 * @param {Array<Object>} props.userResponses List of quiz responses from the user.
 * @param {() => void} props.onLogout Callback to log the user out.
 * @param {(updates: Object) => Promise<void>} props.onUpdateUser Callback to update user data.
 * @param {() => Promise<void>} props.onDeleteAccount Callback to delete the account.
 * @param {(idQuiz: number) => Promise<void>} props.onUnpin Callback to unpin a quiz.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @param {(message: string) => void} props.showInfo Function to display an information message.
 *
 * @returns {JSX.Element} the private profile page.
 */
function PrivateProfile({user, userResponses, onLogout, onUpdateUser, onDeleteAccount, onUnpin, showError, showInfo}) {
    const navigate = useNavigate();

    /** Indicates if the editing profile view is currently showed */
    const [isEditing, setIsEditing] = useState(false);
    /** The currently edited username */
    const [editedUsername, setEditedUsername] = useState(user.username);
    /** The currently edited user email */
    const [editedEmail, setEditedEmail] = useState(user.email);
    /** The currently edited new password */
    const [newPassword, setNewPassword] = useState("");
    /** The currently edited new password confirmation */
    const [confirmPassword, setConfirmPassword] = useState("");

    /** Indicates if the deletion confirmation paragraph is visible */
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    /** Average note given for user quiz responses. */
    const averageNote = validNotes.length > 0
        ? (validNotes.reduce((acc, note) => acc + note, 0) / validNotes.length).toFixed(1)
        : 0;

    /**
     * Saves user profile modifications (username, email, password).
     *
     * Behavior:
     * - Validates password confirmation if password is changed
     * - Builds a diff object of modified fields only
     * - Calls onUpdateUser to persist changes
     * - Resets editing state on success
     * - Restores previous values and shows error on failure
     * 
     * @returns {Promise<void>}
     */
    const handleSaveChanges = async () => {
        if (newPassword && newPassword != confirmPassword) {
            showError("Passwords don't match !");
            return;
        }

        const updates = {};
        if (editedUsername != user.username) updates.username = editedUsername;
        if (editedEmail != user.email) updates.email = editedEmail;
        if (newPassword) updates.password = newPassword;

        if (Object.keys(updates).length > 0) {
            try {
                await onUpdateUser(updates);
                setIsEditing(false);
                setNewPassword("");
                setConfirmPassword("");
                showInfo("Profile updated successfully");
            } catch (error) {
                const message = error.response?.data || error.message || "Unknown error";
                if (error.response?.status == 409) {
                    showError("Username or email already taken");
                } else {
                    console.error("Error updating profile :\n", message);
                    showError("Failed to update profile");
                }

                setEditedUsername(user.username);
                setEditedEmail(user.email);
                setNewPassword("");
                setConfirmPassword("");
            }
        } else {
            setIsEditing(false);
        }
    };

    /**
     * Handles account deletion with a confirmation step.
     *
     * Behavior:
     * - First call triggers confirmation UI
     * - Second call (if confirmed) deletes account
     * - Removes cached quizzes from localStorage
     * - Displays success or error messages

     * @returns {Promise<void>}
     */
    const handleDeleteAccount = async () => {
        if (showDeleteConfirm) {
            try {
                await onDeleteAccount();
                localStorage.removeItem("quizzes"); // ensures that new statistics will be taken into account for the quizzes list
                showInfo("Profile deleted successfully");
            } catch (error) {
                console.error("Error deleting account:\n", error.response.data);
                showError("Failed to delete account");
            }
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
                                        <span>Joined {formatDate(user.subscribeDate)}</span>
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
                                    className="flex items-center gap-2 px-4 py-2 bg-peacefullissue hover:bg-darkpeacefullissue text-white rounded-lg transition-colors cursor-pointer"
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

            {/* Pinned Quizzes */}
            <div className="bg-midissue rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">
                    Pinned Quizzes
                </h2>

                {!user.pinnedQuizzes || user.pinnedQuizzes.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                        No pinned quizzes yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {user.pinnedQuizzes.map((quizId) => (
                            <div
                                key={quizId}
                                title="Go to quiz"
                                onClick={() => navigate("/quiz/" + quizId)}
                                className="flex items-center justify-between p-4 bg-[#16182e] rounded-lg hover:bg-[#1a1d3a] transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        title="Unpin"
                                        onClick={(e) => {
                                            e.stopPropagation(); // to prevent navigating to the quiz page
                                            onUnpin(quizId);
                                        }}
                                        className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center group cursor-pointer"
                                    >
                                        <Pin className="w-5 h-5 text-orange-400 group-hover:hidden" fill="currentColor" />
                                        <PinOff className="w-5 h-5 text-orange-400 hidden group-hover:block" fill="currentColor" />
                                    </button>

                                    <div>
                                        <p className="text-white font-medium">
                                            Quiz #{quizId}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="bg-midissue rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Your Recent Activity</h2>
                
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
