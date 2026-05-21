/**
 * Renders a progress bar.
 * @param {number} props.now The current value of the progress bar (in %).
 * @param {string} props.className Eventual additional styles to apply to the ProgressBar.
 * @returns {JSX.Element} a progress bar.
 */
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