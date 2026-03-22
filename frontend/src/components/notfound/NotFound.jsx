import { useEffect } from 'react';

function NotFound(props) {

    useEffect(() => {
        document.title = "ISSue - Not Found";
    }, []);

    return (
        <div id="NotFound-display">
            <p>Not Found</p>
        </div>
    )
}

export default NotFound;