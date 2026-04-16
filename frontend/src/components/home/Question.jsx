import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import ReactCountryFlag from "react-country-flag";

function Question({question, showResult, setSelected}) {

    const [selectedIndex, setSelectedIndex] = useState(-1); // local index of an answer, 0-3

    function getButtonClass(index) {
        if (showResult) {
            if (index === question.indexResponse) {
                return "correct-response";
            }
            if (index === selectedIndex) {
                return "bad-response";
            }
            return "";
        }

        return index === selectedIndex ? "selected-response" : "";
    }

    function clickAnswerHandler(index){
        if (selectedIndex === index) { // unselect answer if already selected and clicked
            setSelectedIndex(-1);
            setSelected(-1);
            return;
        }

        setSelectedIndex(index);
        setSelected(index === question.indexResponse ? 1 : 0);
    }

    return (
        <div className="Home-question-display">
            <h3 className="text-center">Question n°{question.numQuestion+1}</h3>

            <p className="text-center">{question.question}</p>

            <div className="Home-question-options">
                {question.options.map((option, index) => (
                    <button
                        className={getButtonClass(index)}
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