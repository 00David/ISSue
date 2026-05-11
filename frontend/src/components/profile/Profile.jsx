import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import NotFound from '../notfound/NotFound.jsx';
import Spinner from '../utility/Spinner.jsx';
import PublicProfile from './PublicProfile.jsx';
import PrivateProfile from './PrivateProfile.jsx';

function Profile({connected, setConnected}) {

    // The id of the profile is got from URL
    let { id } = useParams();

    const [user, setUser] = useState(null);
    const [quizResponses, setQuizResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const navigate = useNavigate();

    // Determine if this is the user's own profile
    const isOwnProfile = connected !== -1 && parseInt(id) === connected;

    useEffect(() => {
        document.title = "ISSue - Profile";
    }, []);

    // Fetch user data and their quiz responses
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // Fetch user info
                const userResponse = await axios.get("/api/resources/users/"+id,{
                    withCredentials: true
                });
                setUser(userResponse.data);

                // Fetch all quiz responses for this user
                const quizzesPromises = userResponse.data.respondedQuizzes.map(async (idQuizR) => {
                    try {
                        const response = await axios.get(
                            "/api/resources/quiz-responses/"+idQuizR
                        );
                        return response.data;
                    } catch (error) {
                        console.error("Error fetching responded quiz "+idQuizR+"\n", error.response.data);
                        return null;
                    }
                });

                const quizzesResults = await Promise.all(quizzesPromises);
                const validQuizzes = quizzesResults.filter(q => q !== null);
                setQuizResponses(validQuizzes);

            } catch (error) {
                if (error.response?.status === 404) {
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
            await axios.post("/api/authentification/logout", {}, {
                withCredentials: true
            });

            // Reset local connected state and redirect to login
            setConnected(-1);
            navigate("/login");

        } catch (error) {
            console.error("Error while logging out:\n", error.response.data);
        }
    };

    const handleUpdateUser = async (updates) => {
        try {
            await axios.patch("/api/resources/users/"+id, updates);
            
            // Refresh user data
            const userResponse = await axios.get("/api/resources/users/"+id);
            setUser(userResponse.data);
            
            alert("Profile updated successfully !");
        } catch (error) {
            console.error("Error updating profile:\n", error.response.data);
            alert("Failed to update profile.");
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`/api/resources/users/${id}`);
            
            // Logout after deletion
            await axios.post('/api/authentification/logout', {}, {
                withCredentials: true
            });
            
            setConnected(-1);
            navigate("/");
            
            alert("Account deleted successfully.");
        } catch (error) {
            console.error("Error deleting account:\n", error.response.data);
            alert("Failed to delete account");
        }
    };

    if (loading) {
        return (
            <div id="Profile-display" className="flex flex-col items-center justify-center min-h-[60vh]">
                <Spinner />
                <p className="text-gray-400 mt-4">Loading profile...</p>
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
