import { useEffect } from 'react';

function Login(props) {

    useEffect(() => {
        document.title = "ISSue - Login";
    }, []);

    return (
        <div id="Login-display">
            <p>Login</p>
        </div>
    )
}

export default Login;