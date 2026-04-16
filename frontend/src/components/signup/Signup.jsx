import { useEffect } from 'react';

function Signup() {

        useEffect(() => {
        document.title = "ISSue - Sign up";
    }, []);

    return (
        <div id="Signup-display">
            <p>Signup</p>
        </div>
    )
}

export default Signup;