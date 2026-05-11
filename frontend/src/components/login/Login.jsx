import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({connected, setConnected}) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        document.title = "ISSue - Login";
        if (connected !== -1) {
            navigate("/");
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
            setConnected(res.data.id);

            // User redirected on its profile page
            navigate("/profile/"+res.data.id);

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
                    className="py-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
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