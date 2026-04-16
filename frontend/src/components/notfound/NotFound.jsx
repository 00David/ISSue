import { useEffect } from 'react';

function NotFound() {

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