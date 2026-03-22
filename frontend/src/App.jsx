import { BrowserRouter, Route, Routes } from "react-router";

import Home from './components/home/Home.jsx'
import Login from './components/login/Login.jsx'
import Signup from './components/signup/Signup.jsx'
import Profile from './components/profile/Profile.jsx'
import NotFound from './components/notfound/NotFound.jsx';

function App() {

	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} /> {/* Home page */}
        <Route path="/quiz/:id" element={<Home />} /> {/* Home page displaying a specific quiz */}
				<Route path="/login" element={<Login />} /> {/* Login page */}
        <Route path="/signup" element={<Signup />} /> {/* Sign up page */}
        <Route path="/profile/:id" element={<Profile />} /> {/* Profile page */}
        <Route path="*" element={<NotFound />} /> {/* For non existing paths */}
			</Routes>
		</BrowserRouter>
	)
}

export default App
