import { useState } from 'react';
import { Star, X } from 'lucide-react';

function CompletedQuizPopup({connected, postResponse,
    showPopup, setShowPopup, 
    score, note, setNote,
    comment, setComment}) {

    // Some comments...
    const boss = ["Perfect score.", "You crushed it.", "Absolutely flawless.", "Top-tier performance.", "Mastered completely."];
    const almostGotIt = ["So close to perfect.", "Great job overall.", "Almost flawless.", "Very strong result.", "You nearly nailed it."];
    const couldBeBetter = ["Not bad at all.", "Decent attempt.", "You're getting there.", "Some mistakes, but solid.", "Could be better."];
    const meh = ["That was rough.", "Needs more practice.", "Not your best run.", "A bit messy.", "Keep trying."];
    const how = ["How did this happen?", "Did you guess everything?", "That was impressive... negatively.", "Maybe retry this one.", "At least you tried."];

    const [randomCommentOnNote] = useState(() => {
        const randomSentence = (arr) => arr[Math.floor(Math.random() * arr.length)];
        
        if (score === 10) return randomSentence(boss);
        if (score >= 7) return randomSentence(almostGotIt);
        if (score >= 5) return randomSentence(couldBeBetter);
        if (score >= 3) return randomSentence(meh);
        return randomSentence(how);
    });

    function setStarNote(numStar){
        if (numStar === note) {
            setNote(0);
        } else {
            setNote(numStar);
        }
    }

    function checkBeforePost(){
        if (connected === -1) {
            alert("Need to be connected to post");
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
                    <p>{randomCommentOnNote}</p>
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
                onClick={() => checkBeforePost()}
                className="
                    mt-4
                    w-full
                    rounded-xl
                    bg-[#4a7ba7]
                    px-4
                    py-3
                    font-semibold
                    text-white
                    shadow-lg
                    transition-all
                    duration-200
                    hover:bg-[#304d73]
                    hover:scale-[1.02]
                    active:scale-[0.98]
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                "
            >
                Post quiz response !
            </button>
            </div>
        </div>
    );
}

export default CompletedQuizPopup;