import { BrowserRouter, Route, Routes } from "react-router";
import { useEffect, useState } from 'react';
import api from "./api/axios";

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

/**
 * Renders the application, by defining its routes.
 * @returns {JSX.Element} The application
 */
function App() {

	/**
	 * A pair :
	 * - id of the connected user, or -1 if not connected
	 * - username of the connected user, or "" if not connected
	 */
	const [connected, setConnected] = useState({
		id: -1,
		username: ""
	});

	/** Used for diplaying an error popup globally in the application. */
	const [error, setError] = useState({
		showError: false,
		errorMessage: ""
	});

	/** Used for diplaying an informational popup globally in the application. */
	const [info, setInfo] = useState({
		showInfo: false,
		infoMessage: ""
	});

	useEffect(() => {
		/**
		 * Fetch and potentially update the user connected status.
		 */
		const fetchConnected = async () => {
			try {
				const response = await api.get('/api/authentification/me');
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
		fetchConnected();
	}, []);

	/**
	 * Diplay an error popup.
	 * @param {string} errorMessage Error message
	 */
	const showError = (errorMessage) => {
		setError({
			showError: true,
			errorMessage: errorMessage
		})
	}

	/** On closing error popup, erase the message. */
	const onCloseError = () => {
		setError({
			showError: false,
			errorMessage: ""
		})
	}

	/**
	 * Diplay an informational popup.
	 * @param {string} infoMessage Informational message
	 */
	const showInfo = (infoMessage) => {
		setInfo({
			showInfo: true,
			infoMessage: infoMessage
		})
	}

	/** On closing informational popup, erase the message. */
	const onCloseInfo = () => {
		setInfo({
			showInfo: false,
			infoMessage: ""
		})
	}

	return (
		<BrowserRouter>
			{/* Navigation top bar */}
			<NavBar connectedId={connected.id} connectedUsername={connected.username}></NavBar>

			{/* Error / information popups */}
			{error.showError && (<ErrorPopup message={error.errorMessage} onClose={onCloseError}></ErrorPopup>)}
			{info.showInfo && (<InfoPopup message={info.infoMessage} onClose={onCloseInfo}></InfoPopup>)}

			{/* Routes */}
			<Routes>
				{/* Home page */}
				<Route path="/" element={<Home connectedId={connected.id} showError={showError} showInfo={showInfo} />} />

				{/* Available quizzes page */}
				<Route path="/quizzes" element={<Quizzes connectedId={connected.id} showError={showError} />} />

				{/* Specific quiz page */}
				<Route path="/quiz/:id" element={<QuizPage connectedId={connected.id} showError={showError} showInfo={showInfo} />} />

				{/* ISSue users leaderboard page */}
				<Route path="/leaderboard" element={<LeaderboardPage />} />

				{/* Login page */}
				<Route path="/login" element={<Login connectedId={connected.id} setConnected={setConnected} showError={showError} />} />

				{/* Sign up page */}
				<Route path="/signup" element={<Signup connectedId={connected.id} setConnected={setConnected} showError={showError} />} />

				{/* Profile page */}
				<Route path="/profile/:id" element={<Profile connectedId={connected.id} setConnected={setConnected} showError={showError} showInfo={showInfo} />} />
				
				{/* For non existing paths */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App;
