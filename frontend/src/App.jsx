import { BrowserRouter, Route, Routes } from "react-router";
import { useEffect, useState } from 'react';
import axios from 'axios';
axios.defaults.withCredentials = true;

import Home from './components/home/Home.jsx';
import Quizzes from "./components/quizzes/Quizzes.jsx";
import QuizPage from "./components/quiz/QuizPage.jsx";
import LeaderboardPage from "./components/leaderboard/LeaderboardPage.jsx";
import Login from './components/login/Login.jsx';
import Signup from './components/signup/Signup.jsx';
import Profile from './components/profile/Profile.jsx';
import NotFound from './components/notfound/NotFound.jsx';
import NavBar from "./components/navbar/NavBar.jsx";
import ErrorPopup from "./components/popup/ErrorPopup.jsx";
import InfoPopup from "./components/popup/InfoPopup.jsx";

function App() {

	/**
	 * - id of the connected user, or -1 if not connected
	 * - username of the connected user, or "" if not connected
	 */
	const [connected, setConnected] = useState({
		id: -1,
		username: ""
	});

	const [error, setError] = useState({
		showError: false,
		errorMessage: ""
	});
	const [info, setInfo] = useState({
		showInfo: false,
		infoMessage: ""
	});

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await axios.get('/api/authentification/me');
				if (response.data.id != -1 && response.data.user != "") {
					setConnected({ 
						id: response.data.id, 
						username: response.data.user 
					});
				}
			} catch (error) {
				console.error("Error while fetching current connection state:\n", error);
			}
		}
		fetchUser();
	}, []);

	const showError = (errorMessage) => {
		setError({
			showError: true,
			errorMessage: errorMessage
		})
	}

	const onCloseError = () => {
		setError({
			showError: false,
			errorMessage: ""
		})
	}

	const showInfo = (infoMessage) => {
		setInfo({
			showInfo: true,
			infoMessage: infoMessage
		})
	}

	const onCloseInfo = () => {
		setInfo({
			showInfo: false,
			infoMessage: ""
		})
	}

	return (
		<BrowserRouter>
			<NavBar connectedId={connected.id} connectedUsername={connected.username}></NavBar>
			{error.showError && (<ErrorPopup message={error.errorMessage} onClose={onCloseError}></ErrorPopup>)}
			{info.showInfo && (<InfoPopup message={info.infoMessage} onClose={onCloseInfo}></InfoPopup>)}
			<Routes>
				<Route path="/" element={<Home connectedId={connected.id} showError={showError} showInfo={showInfo} />} /> {/* Home page */}
				<Route path="/quizzes" element={<Quizzes connectedId={connected.id} showError={showError} />} /> {/* Page displaying available quizzes */}
				<Route path="/quiz/:id" element={<QuizPage connectedId={connected.id} showError={showError} showInfo={showInfo} />} /> {/* Page displaying a specific quiz */}
				<Route path="/leaderboard" element={<LeaderboardPage />} /> {/* Page displaying leaderboard of ISSue users */}
				<Route path="/login" element={<Login connectedId={connected.id} setConnected={setConnected} showError={showError} />} /> {/* Login page */}
				<Route path="/signup" element={<Signup connectedId={connected.id} setConnected={setConnected} showError={showError} />} /> {/* Sign up page */}
				<Route path="/profile/:id" element={<Profile connectedId={connected.id} setConnected={setConnected} showError={showError} showInfo={showInfo} />} /> {/* Profile page */}
				<Route path="*" element={<NotFound />} /> {/* For non existing paths */}
			</Routes>
		</BrowserRouter>
	)
}

export default App;
