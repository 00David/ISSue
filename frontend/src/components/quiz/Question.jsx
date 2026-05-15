import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import ReactCountryFlag from "react-country-flag";

function Question({question, showResult, selected, setSelected}) {

    const [selectedIndex, setSelectedIndex] = useState(selected[question.numQuestion]); // local index of an answer, 0-3

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

    const clickAnswerHandler = (index) => {
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
                        onClick={ () => clickAnswerHandler(index)}
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