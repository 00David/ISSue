import { useNavigate } from 'react-router-dom';
import { LogIn } from "lucide-react";

function NavBar({connectedId, connectedUsername}) {
    const navigate = useNavigate();

    return (
        <nav id="navbar" className="sticky top-0 w-full h-10 z-1001 bg-midissue flex items-center justify-between">
            
            {/* Home link */}
            <div id="navbar-1" className="flex items-center justify-center px-2">
                <img
                    className="cursor-pointer w-11 h-7 flex justify-center items-center" 
                    src="/ISSue_logo_png.png"
                    alt="ISSue"
                    onClick={() => navigate("/")}>
                </img>
                <span 
                    className="cursor-pointer hover:text-gray-400"
                    onClick={() => navigate("/")}>
                    <strong>ISS</strong>ue
                </span>
            </div>

            {/* Quizzes link */}
            <div id="navbar-2" className="absolute left-3/8 -translate-x-3/8">
                <span 
                    className="cursor-pointer hover:text-gray-400"
                    onClick={() => navigate("/quizzes")}>
                    Quizzes
                </span>
            </div>

            {/* Leaderboard link */}
            <div id="navbar-3" className="absolute left-5/8 -translate-x-5/8">
                <span 
                    className="cursor-pointer hover:text-gray-400"
                    onClick={() => navigate("/leaderboard")}>
                    Leaderboard
                </span>
            </div>

            {/* Connected (or not) icon + login/profile link depending on connected state */}
            <div id="navbar-4" className="flex justify-center items-center px-2">
                {connectedId == -1 ? 
                    <LogIn className= "cursor-pointer  hover:text-gray-400" 
                        onClick={() => navigate("/login")}></LogIn>
                    : <div className="cursor-pointer w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg"
                        onClick={() => navigate("/profile/"+connectedId)}>
                        {connectedUsername.charAt(0).toUpperCase()}
                    </div>
                }
            </div>

        </nav>
    )
}

export default NavBar;