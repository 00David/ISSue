import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Renders the login page, allowing to enter its username and password.
 * @param {number} props.connectedId -1 if not connected, or the connected user id.
 * @param {(connectedId: number) => void} props.setConnected Function to set a new connected id.
 * @param {(message: string) => void} props.showError Function to display an error message.
 * @returns {JSX.Element} the login page.
 */
function Login({connectedId, setConnected, showError}) {
    const navigate = useNavigate();

    /** Current entered username */
    const [username, setUsername] = useState("");
    /** Current entered password */
    const [password, setPassword] = useState("");

    useEffect(() => {
        document.title = "ISSue - Login";
        if (connectedId !== -1) { // User redirected on its profile page if connected
            navigate("/profile/"+connectedId); 
        }
    }, [connectedId, navigate]);

    /**
     * Called on login submit, if entered infos are okay, connect the user and redirects him to its profile page.
     * Otherwise, displays an error popup.
     * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Login
            await axios.post("/api/authentification/login", {
                username,
                password
            });

            // If it went previously ok, get the connected user id
            const res = await axios.get("/api/authentification/me");
            setConnected({ // triggers a redirection to the user profile page (via local useEffect)
                id: res.data.id,
                username: username
            });

        } catch (err) {
            if (err.response?.status == 401 || err.response?.status == 404) {
                showError("Invalid username or password");
            } else {
                console.error("Error while loging in :\n"+err.response?.data);
                showError("Server error");
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
                    Login
                </button>

                {/* Link to sign up */}
                <p className="text-sm text-center mt-2">
                    Don't have an account?{" "}
                    <Link className="text-peacefullissue no-underline transition-colors duration-300 ease-in-out hover:text-[#6a9bc7] hover:underline" 
                            to="/signup">
                        Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Login;