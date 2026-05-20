import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import NotFound from '../notfound/NotFound.jsx';
import Spinner from '../utility/Spinner.jsx';
import PublicProfile from './PublicProfile.jsx';
import PrivateProfile from './PrivateProfile.jsx';

function Profile({connectedId, setConnected, showError, showInfo}) {

    // The id of the profile is got from URL
    let { id } = useParams();

    const [user, setUser] = useState(null);
    const [quizResponses, setQuizResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const navigate = useNavigate();

    // Determine if this is the user's own profile
    const isOwnProfile = connectedId != -1 && parseInt(id) == connectedId;

    useEffect(() => {
        document.title = "ISSue - Profile";
    }, []);

    // Fetch user data and their quiz responses
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Fetch user info
                const userInfos = await axios.get("/api/resources/users/"+id);
                setUser(userInfos.data);

                // Fetch all quiz responses for this user
                const quizzesPromises = userInfos.data.respondedQuizzes.map(async (idQuizR) => {
                    try {
                        const response = await axios.get("/api/resources/quiz-responses/"+idQuizR);
                        return response.data;
                    } catch (error) {
                        console.error("Error fetching responded quiz "+idQuizR+"\n", error.response.data);
                        return null;
                    }
                });

                const quizzesResults = await Promise.all(quizzesPromises);
                setQuizResponses(quizzesResults);

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

    const handleLogout = async () => {
        try {
            await axios.post("/api/authentification/logout");

            // Reset local connected state and redirect to login
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

    const handleUpdateUser = async (updates) => {
        const isValidEmail = (email) => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        };

        if (updates.email && !isValidEmail(updates.email)){
            throw new Error("Invalid email format");
        }

        await axios.patch("/api/resources/users/"+id, updates);
        
        // Refresh user data
        const userInfos = await axios.get("/api/resources/users/"+id);
        setUser(userInfos.data);
    };

    const handleDeleteAccount = async () => {
        await axios.delete("/api/resources/users/"+id);
            
        // Logout after deletion
        await axios.post("/api/authentification/logout");
            
        setConnected({
            id: -1,
            username: "",
        });
        navigate("/");
    };

    const handleUnpin = async (idQuiz) => {
        // Immediately delete locally the unpined quiz id
        setUser(prev => ({
            ...prev, // copy the previous user infos
            pinnedQuizzes: prev.pinnedQuizzes.filter(id => id != idQuiz) // for pinnedQuizzes, overwrite it with the same array without idQuiz
        }));

        try {
            await axios.post("/api/resources/users/unpin", {
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
            {isOwnProfile ? (
                <PrivateProfile 
                    user={user}
                    quizResponses={quizResponses}
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
                    quizResponses={quizResponses}
                />
            )}
        </div>
    );
}

export default Profile;
