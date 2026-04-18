import { useEffect } from 'react';

function NotFound() {

    useEffect(() => {
        document.title = "ISSue - Not Found";
    }, []);

    return (
        <div className="flex flex-col items-center justify-center 
            min-h-[calc(100vh-2.5rem)] text-center gap-6 px-4">
            <img
                className="w-110 h-70"
                src="/ISSue_explosion.png"
                alt="ISSue"
            />

            <h2 className="text-xl text-gray-400">
                Houston, we’ve got an ISSue...
            </h2>

            <h1 className="text-2xl md:text-5xl font-bold">
                Page not found
            </h1>
        </div>
    )
}

export default NotFound;