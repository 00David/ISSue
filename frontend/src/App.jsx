import { BrowserRouter, Route, Routes } from "react-router";
import { useEffect, useState } from 'react';
import axios from 'axios';

import Home from './components/home/Home.jsx'
import Login from './components/login/Login.jsx'
import Signup from './components/signup/Signup.jsx'
import Profile from './components/profile/Profile.jsx'
import NotFound from './components/notfound/NotFound.jsx';
import NavBar from "./components/navbar/NavBar.jsx";

function App() {

	const [connected, setConnected] = useState(-1); // id of the connected user, or -1 if not connected

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await axios.get('/api/authentification/me', {
					withCredentials: true
				});
				if (response.data.id != -1) {
					setConnected(response.data.id);
				}
			} catch (error) {
				console.error("Error while fetching current connection state:\n", error);
			}
		}
		fetchUser();
	}, []);

	return (
		<BrowserRouter>
			<NavBar connected={connected} setConnected={setConnected}></NavBar>
			<Routes>
				<Route path="/" element={<Home connected={connected} setConnected={setConnected} />} /> {/* Home page */}
				<Route path="/quiz/:id" element={<Home connected={connected} setConnected={setConnected} />} /> {/* Home page displaying a specific quiz */}
				<Route path="/login" element={<Login connected={connected} setConnected={setConnected} />} /> {/* Login page */}
				<Route path="/signup" element={<Signup connected={connected} setConnected={setConnected} />} /> {/* Sign up page */}
				<Route path="/profile/:id" element={<Profile connected={connected} setConnected={setConnected} />} /> {/* Profile page */}
				<Route path="*" element={<NotFound />} /> {/* For non existing paths */}
			</Routes>
		</BrowserRouter>
	)
}

export default App;
