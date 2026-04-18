function ProgressBar({ now = 0, className = "" }) {
    return (
        <div className={"w-full bg-white rounded-full h-3 overflow-hidden "+className}>
            <div
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(Math.max(now, 0), 100)}%` }}
            />
        </div>
    );
}

export default ProgressBar;