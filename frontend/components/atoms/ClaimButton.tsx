interface ClaimButtonProps {
    claimed?: boolean;
    claimedBy?: string;
    userColor?: string;
    isLoading?: boolean;
    onClick?: () => void;
    className?: string;
}

export default function ClaimButton({
    claimed = false,
    claimedBy = "",
    userColor = "bg-emerald-500",
    isLoading = false,
    onClick,
    className = "",
}: ClaimButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
                w-full aspect-square rounded-full flex items-center justify-center
                font-bold text-[clamp(0.75rem,2.5vw,1rem)] transition-all duration-200
                border-2 ${claimed ? "border-emerald-600" : "border-emerald-300 hover:border-emerald-500"}
                ${isLoading ? "opacity-60 cursor-wait" : "cursor-pointer hover:scale-110"}
                ${claimed ? `${userColor} text-white shadow-lg` : "bg-white text-emerald-600"}
                ${className}
            `}
        >
            {isLoading ? (
                <div className="animate-spin">
                    <svg
                        className="w-1/2 h-1/2 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
            ) : claimed ? (
                <span>{claimedBy}</span>
            ) : null}
        </button>
    );
}