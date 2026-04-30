import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import NotFound from '../notfound/NotFound.jsx'

function Profile({connected, setConnected}) {

    // The id of the profile is got from URL
    let { idProfile } = useParams();

    // State for handling an access to a non existant profile
    const [notFound, setNotFound] = useState(false);

    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await axios.post('/api/authentification/logout', {}, {
                withCredentials: true
            });

            // Reset local connected state and redirect to login
            setConnected(-1);
            navigate("/login");

        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        document.title = "ISSue - Profile";
    }, []);

    if (notFound) {
		return <NotFound/>
  	}

    return (
        <div id="Profile-display">
            <p>Profile</p>
            <button onClick={() => handleLogout()}>Logout</button>
        </div>
    )
}

export default Profile;