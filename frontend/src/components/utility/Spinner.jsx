/**
 * Renders a spinner with configurable size.
 *
 * @param {"sm" | "md" | "lg"} props.size - The size of the spinner.
 * @returns {JSX.Element} a spinning loader component.
 */
function Spinner({ size = "md" }) {

    const sizeMap = {
        sm: "w-4 h-4 border-3",
        md: "w-8 h-8 border-4",
        lg: "w-12 h-12 border-5"
    };

    return (
        <div
            className={`
                ${sizeMap[size]}
                border-gray-400/30
                border-t-gray-400
                rounded-full
                animate-spin
            `}
        />
    );
}

export default Spinner;