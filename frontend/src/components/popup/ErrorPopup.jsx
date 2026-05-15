import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorPopup = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-1002">
            <div className="relative bg-midissue rounded-xl shadow-xl max-w-md w-full overflow-hidden
                animate-[slideDown_0.3s_ease-out]">

                {/* Accent bar */}
                <div className="h-1.5 bg-linear-to-r bg-red-500" />
                
                {/* The popup box */}
                <div className="p-6">

                    <div className="flex flex-col items-center text-center">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mb-4">
                            <AlertCircle className="text-red-500" size={28} />
                        </div>
                        {/* Message */}
                        <p className="text-gray-400 leading-relaxed mb-6 whitespace-pre-line">
                            {message}
                        </p>
                    </div>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className="w-full bg-linear-to-r bg-red-500 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorPopup;