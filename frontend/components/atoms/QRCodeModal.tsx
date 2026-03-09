'use client';

interface QRCodeModalProps {
    qrCodeUrl: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function QRCodeModal({ qrCodeUrl, isOpen, onClose }: QRCodeModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-md w-full rounded-2xl bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Share Session</h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label="Close modal"
                    >
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="w-full max-w-xs rounded-xl border-2 border-emerald-200 bg-white p-4 shadow-sm">
                        <img
                            src={qrCodeUrl}
                            alt="QR Code for session"
                            className="w-full h-auto"
                        />
                    </div>
                    <p className="text-center text-sm text-slate-600 sm:text-base">
                        Scan this QR code to join the session
                    </p>
                </div>
            </div>
        </div>
    );
}
