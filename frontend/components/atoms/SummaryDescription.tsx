export default function SummaryDescription() {
    return (
        <div className="flex flex-col items-center gap-8">
            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center sm:w-36 sm:h-36">
                <svg
                    className="w-16 h-16 text-white sm:w-20 sm:h-20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            </div>
            <p className="text-3xl font-semibold text-center text-slate-900 sm:text-4xl">
                Thank You For Using Our Service
            </p>
        </div>
    );
}