import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, X } from 'lucide-react';

function CompletedQuizPopup({connectedId, postResponse, showPopup, setShowPopup, 
    score, note, setNote, comment, setComment, showInfo}) {
    const navigate = useNavigate();

    const randomComment = useMemo(() => {
        const boss = ["Perfect score.", "You crushed it.", "Absolutely flawless.", "Top-tier performance.", "Mastered completely."];
        const almostGotIt = ["So close to perfect.", "Great job overall.", "Almost flawless.", "Very strong result.", "You nearly nailed it."];
        const couldBeBetter = ["Not bad at all.", "Decent attempt.", "You're getting there.", "Some mistakes, but solid.", "Could be better."];
        const meh = ["That was rough.", "Needs more practice.", "Not your best run.", "A bit messy.", "Keep trying."];
        const how = ["How did this happen?", "Did you guess everything?", "That was impressive... negatively.", "Maybe retry this one.", "At least you tried."];

        // eslint-disable-next-line react-hooks/purity
        const randomSentence = (arr) => arr[Math.floor(Math.random() * arr.length)];

        if (score === 10) return randomSentence(boss);
        else if (score >= 7) return randomSentence(almostGotIt);
        else if (score >= 5) return randomSentence(couldBeBetter);
        else if (score >= 3) return randomSentence(meh);
        return randomSentence(how);
    }, [score]);

    const setStarNote = (numStar) => {
        if (numStar == note) {
            setNote(0);
        } else {
            setNote(numStar);
        }
    }

    const postResponseHandler = () => {
        if (connectedId == -1) {
            navigate("/login"); // if not connected, redirect to login
            showInfo("Need to have an account !");
        } else {
            postResponse();
        }
    }

    if (!showPopup) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-1002">

            {/* Popup box */}
            <div className="relative bg-midissue rounded-xl shadow-xl p-6 w-100
                            animate-[slideDown_0.3s_ease-out]">

                {/* Close button */}
                <button
                    onClick={() => setShowPopup(false)}
                    className="absolute top-2 right-2 bg-midissue text-black p-2 rounded
                            hover:bg-red-500 transition group"
                >
                    <X className="text-white" />
                </button>

                {/* Score */}
                <div className="text-center mb-4">
                    <h2>Your score :</h2>
                    <h1>{score}/10</h1>
                    <p>{randomComment}</p>
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-4">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Star
                            key={i}
                            className="cursor-pointer"
                            fill={i < note ? "gold" : "none"}
                            color={i < note ? "gold" : "currentColor"}
                            onClick={() => setStarNote(i + 1)}
                        />
                    ))}
                </div>

                {/* Comment */}
                <textarea
                    className="w-full border rounded p-2"
                    placeholder="Leave a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

            {/* Post response */}
            <button
                onClick={() => postResponseHandler()}
                className="
                    text-white
                    hover:bg-darkpeacefullissue
                    bg-peacefullissue
                    w-full
                    active:scale-[0.98]
                    mt-4
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    shadow-lg
                    transition-all
                    duration-200
                    hover:scale-[1.02]
                    cursor-pointer
                "
            >
                Post quiz response !
            </button>
            </div>
        </div>
    );
}

export default CompletedQuizPopup;