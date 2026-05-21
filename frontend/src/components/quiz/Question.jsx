import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import ReactCountryFlag from "react-country-flag";

/**
 * Renders a single quiz question with multiple-choice answers.
 *
 * Handles:
 * - Local selection state (selected answer)
 * - Synchronization with parent quiz state
 * - Visual feedback (selected / correct / wrong answers)
 * - Locking answers when results are shown
 *
 * @param {Object} props.question The question object to display.
 * @param {boolean} props.showResult Whether results are being displayed (locks answers + highlights correctness).
 * @param {number[]} props.selected Global selected answers array from parent quiz component.
 * @param {(index: number) => void} props.setSelected Callback to update selected answer in parent state.
 * @returns {JSX.Element} Quiz question with selectable answers.
 */
function Question({question, showResult, selected, setSelected}) {

    /** Local index of a selected answer, 0-3 */
    const [selectedIndex, setSelectedIndex] = useState(selected[question.numQuestion]);

    /**
     * Computes the CSS class applied to an answer button depending on state.
     *
     * Behavior:
     * - If results are shown:
     *   - correct answer → "correct-response"
     *   - wrong selected answer → "bad-response"
     * - If not showing results:
     *   - selected answer → "selected-response"
     *
     * @param {number} index Index of the answer option
     * @returns {string} CSS class string for styling
     */
    const getButtonClass = (index) => {
        if (showResult) {
            if (index == question.indexResponse) {
                return "correct-response";
            }
            if (index == selectedIndex) {
                return "bad-response";
            }
            return "";
        }

        return index == selectedIndex ? "selected-response" : "";
    }

    /**
     * Handles clicking an answer option.
     *
     * Behavior:
     * - Toggles selection if clicking the same answer
     * - Updates local state
     * - Notifies parent quiz state via setSelected
     *
     * @param {number} index Index of clicked answer
     */
    const handleClickAnswer = (index) => {
        if (selectedIndex == index) { // unselect answer if already selected and clicked
            setSelectedIndex(-1);
            setSelected(-1); // Give the info to the Quiz component
            return;
        }

        setSelectedIndex(index);
        setSelected(index); // Give the info to the Quiz component
    }

    return (
        <div className="m-2">
            <h3 className="text-center">Question n°{question.numQuestion+1}</h3>

            <p className="text-center text-gray-400">{question.question}</p>

            <div className="grid grid-cols-2 gap-3">
                {question.options.map((option, index) => (
                    <button
                        className={"quiz-button "+getButtonClass(index)}
                        key={index}
                        onClick={ () => handleClickAnswer(index)}
                        disabled={showResult}
                    >
                    {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default Question;