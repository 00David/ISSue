import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Signup({connectedId, setConnected, showError}) {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        document.title = "ISSue - Sign up";
        if (connectedId != -1) { // User redirected on its profile page if connected
            navigate("/profile/"+connectedId); 
        }
    }, [connectedId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Signup
            await axios.post('/api/authentification/signup', {
                username,
                email,
                password
            });

            // If it went previously ok, get the connected user id
            const res = await axios.get('/api/authentification/me');
            setConnected({ // triggers a redirection to the user profile page (via local useEffect)
                id: res.data.id,
                username: username
            });

        } catch (err) {
            if (err.response?.status == 400) {
                showError("Invalid data");
            } else if (err.response?.status == 409) {
                showError("Username or email already taken");
            } else {
                console.error("Error while signing up :\n"+err.response?.data);
                showError("Server error");
            }
        }
    };

    return (
        <div className="flex justify-center mt-12">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-80 gap-3 p-6 bg-midissue rounded-2xl shadow-md"
            >
                <h2 className="text-2xl font-semibold text-center">Sign up</h2>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    type="submit"
                    className="
                        text-white
                        bg-peacefullissue
                        hover:bg-darkpeacefullissue
                        mt-4
                        rounded-xl
                        px-4
                        py-3
                        font-semibold
                        shadow-lg
                        cursor-pointer"
                >
                    Sign up
                </button>

                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <p className="text-sm text-center mt-2">
                    Already have an account?{" "}
                    <Link className="text-peacefullissue no-underline transition-colors duration-300 ease-in-out hover:text-[#6a9bc7] hover:underline" 
                            to="/login">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Signup;