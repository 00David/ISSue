import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({connected, setConnected}) {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        document.title = "ISSue - Login";
        if (connected !== -1) { // User redirected on its profile page if connected
            navigate("/profile/"+connected); 
        }
    }, [connected, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Login
            await axios.post('/api/authentification/login', {
                username,
                password
            }, {
                withCredentials: true
            });

            // If it went previously ok, get the connected user id
            const res = await axios.get('/api/authentification/me', {
                withCredentials: true
            });
            setConnected(res.data.id); // triggers a redirection to the user profile page (via local useEffect)

        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 404) {
                setError("Invalid username or password");
            } else {
                console.error("Error while loging in :\n"+err.response?.data);
                setError("Server error");
            }
        }
    };

    return (
        <div className="flex justify-center mt-12 ">

            <form
                onSubmit={handleSubmit}
                className="flex flex-col w-80 gap-3 p-6 bg-midissue rounded-2xl shadow-md"
            >
                <h2 className="text-2xl font-semibold text-center">Login</h2>

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                        bg-[#4a7ba7]
                        hover:bg-[#304d73]
                        mt-4
                        rounded-xl
                        px-4
                        py-3
                        font-semibold
                        shadow-lg
                        cursor-pointer"
                >
                    Login
                </button>

                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <p className="text-sm text-center mt-2">
                    Don't have an account?{" "}
                    <Link to="/signup">Sign up</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;