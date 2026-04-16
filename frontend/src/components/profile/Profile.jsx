import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import NotFound from '../notfound/NotFound.jsx'

function Profile() {

    // The id of the profile is got from URL
    let { idProfile } = useParams();

    // State for handling an access to a non existant profile
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        document.title = "ISSue - Profile";
        setNotFound(false);
    }, [notFound]);

    if (notFound) {
		return <NotFound/>
  	}

    return (
        <div id="Profile-display">
            <p>Profile</p>
        </div>
    )
}

export default Profile;