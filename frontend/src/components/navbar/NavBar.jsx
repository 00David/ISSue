import { useNavigate } from 'react-router-dom';
import { UserRoundX, UserRound } from "lucide-react";

function NavBar({connected}) {
    const navigate = useNavigate();

    return (
        <nav id="navbar" className="sticky top-0 w-full h-10 z-1001 bg-midissue flex items-center justify-between">
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

            <div id="navbar-2" className="absolute left-1/2 -translate-x-1/2">
                <span 
                    className="cursor-pointer hover:text-gray-400"
                    onClick={() => navigate("/quizzes")}>
                    Quizzes
                </span>
            </div>

            <div id="navbar-3" className="flex justify-center items-center px-2">
                {connected == -1 ? 
                    <UserRoundX className= "cursor-pointer  hover:text-gray-400" ></UserRoundX>
                    : <UserRound className= "cursor-pointer  hover:text-gray-400" ></UserRound>
                }
            </div>
        </nav>
    )
}

export default NavBar;