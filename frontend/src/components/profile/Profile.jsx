import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from "../../api/axios";

import NotFound from '../notfound/NotFound.jsx';
import Spinner from '../utility/Spinner.jsx';
import PublicProfile from './PublicProfile.jsx';
import PrivateProfile from './PrivateProfile.jsx';

/**
 * Renders the profile page, containing either the PrivateProfile or the PublicProfile component.
 *
 * Responsibilities:
 * - Fetch user data from backend
 * - Fetch associated quiz responses
 * - Handle logout
 * - Handle user update (email, username, password)
 * - Handle account deletion
 * - Handle quiz unpinning
 *
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {(connectedId: number) => void} props.setConnected Function to set a new connected id.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @param {(message: string) => void} props.showInfo Function to display an informational message.
 *
 * @returns {JSX.Element} The profile page (private or public view).
 */
function Profile({connectedId, setConnected, showError, showInfo}) {

    // The id of the profile is got from URL
    let { id } = useParams();

    /** The user informations */
    const [user, setUser] = useState(null);
    /** The user responses */
    const [userResponses, setUserResponses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const navigate = useNavigate();

    /** Determine if this is the connected user's own profile. In that case, its private infos are retrieved. */
    const isOwnProfile = connectedId != -1 && parseInt(id) == connectedId;

    useEffect(() => {
        document.title = "ISSue - Profile";
    }, []);

    useEffect(() => {
        /**
         * Fetch user data and its quiz responses
         */
        const fetchProfileData = async () => {
            try {
                // Fetch user infos (partially if public infos, otherwise all infos if private)
                const userInfos = await api.get("/api/resources/users/"+id);
                setUser(userInfos.data);

                // Fetch all user responses for this user
                const userResponsesPromises = userInfos.data.userResponses.map(async (idUserR) => {
                    try {
                        const response = await api.get("/api/resources/user-responses/"+idUserR);
                        return response.data;
                    } catch (error) {
                        console.error("Error fetching responses "+idUserR+"\n", error.response.data);
                        return null;
                    }
                });

                const reponses = await Promise.all(userResponsesPromises);
                setUserResponses(reponses);
            } catch (error) {
                if (error.response?.status == 404) {
                    setNotFound(true);
                } else {
                    console.error("Error fetching profile data:\n", error.response.data);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [id]);

    /**
     * Logs out the connected user, and redirects him to the login page.
     */
    const handleLogout = async () => {
        try {
            await api.post("/api/authentification/logout");
            setConnected({
                id: -1,
                username: "",
            });
            navigate("/login");
            showInfo("Logged out successfully");
        } catch (error) {
            console.error("Error while logging out:\n", error.response.data);
            showError("Failed to log out");
        }
    };


    /**
     * Updates user profile information. Supports updating username, email, and password.
     *
     * Validates email format before sending request, and after successful update, refreshes user data from backend.
     *
     * @param {Object} updates Fields to update
     * @param {string} [updates.username] New username
     * @param {string} [updates.email] New email address
     * @param {string} [updates.password] New password
     *
     * @throws {Error} If email format is invalid or request fails.
     */
    const handleUpdateUser = async (updates) => {
        const isValidEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        if (updates.email && !isValidEmail(updates.email)){
            throw new Error("Invalid email format");
        }

        await api.patch("/api/resources/users/"+id, updates);
        
        // Refresh user data
        const userInfos = await api.get("/api/resources/users/"+id);
        setUser(userInfos.data);
    };

    /**
     * Deletes the current user account, logs him out, and redirects him to the login page.
     */
    const handleDeleteAccount = async () => {
        await api.delete("/api/resources/users/"+id);
            
        // Logout after deletion
        await api.post("/api/authentification/logout");
        setConnected({
            id: -1,
            username: "",
        });
        navigate("/");
    };

    /**
     * Unpins a quiz from the user's profile.
     *
     * Optimistically updates UI by removing the quiz from local state, then sends request to backend.
     * If the request fails, the state is rolled back.
     *
     * @param {number} idQuiz id of the quiz to unpin.
     */
    const handleUnpin = async (idQuiz) => {
        // Immediately delete locally the unpined quiz id
        setUser(prev => ({
            ...prev, // copy the previous user infos
            pinnedQuizzes: prev.pinnedQuizzes.filter(id => id != idQuiz) // for pinnedQuizzes, overwrite it with the same array without idQuiz
        }));

        try {
            await api.post("/api/resources/users/unpin", {
                idQuiz
            });
        } catch (error) {
            console.error("Error while unpinning:\n", error.response.data);
            showError("Failed to unpin the quiz");

            // In case of an error : ROLLBACK
            setUser(prev => ({
                ...prev,
                pinnedQuizzes: [...prev.pinnedQuizzes, idQuiz]
            }));
        }
    };

    {/* Spinner on loading */}
    if (loading) {
        return (
            <div id="Profile-display" className="flex flex-col items-center justify-center min-h-[60vh]">
                <Spinner />
                <p className="text-center">Loading profile...</p>
            </div>
        );
    }

    if (notFound) {
        return <NotFound />;
    }

    return (
        <div id="Profile-display" className="container mx-auto px-4 py-8">
            {/* Private profile if the connected user is on its own profile */}
            {/* otherwise, public profile */}
            {isOwnProfile ? (
                <PrivateProfile 
                    user={user}
                    userResponses={userResponses}
                    onLogout={handleLogout}
                    onUpdateUser={handleUpdateUser}
                    onDeleteAccount={handleDeleteAccount}
                    onUnpin={handleUnpin}
                    showError={showError} 
                    showInfo={showInfo}
                />
            ) : (
                <PublicProfile 
                    user={user}
                    userResponses={userResponses}
                />
            )}
        </div>
    );
}

export default Profile;
