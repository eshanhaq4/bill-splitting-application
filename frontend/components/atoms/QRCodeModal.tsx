'use client';

import { useState } from 'react';

interface QRCodeModalProps {
    qrCodeUrl: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function QRCodeModal({ qrCodeUrl, isOpen, onClose }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Extract the actual join URL from the QR code URL
    // qrCodeUrl format: https://api.qrserver.com/v1/create-qr-code/?data=http://localhost:3000/join/SESSION_ID
    const getJoinUrl = () => {
        try {
            const url = new URL(qrCodeUrl);
            return url.searchParams.get('data') || '';
        } catch {
            return '';
        }
    };

    const joinUrl = getJoinUrl();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

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

                    {/* Link with copy button */}
                    <div className="w-full mt-2">
                        <p className="text-xs text-slate-500 mb-2 text-center font-semibold">Or share this link:</p>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <input
                                type="text"
                                value={joinUrl}
                                readOnly
                                className="flex-1 bg-transparent text-xs text-slate-700 outline-none sm:text-sm"
                            />
                            <button
                                onClick={handleCopy}
                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-95 sm:text-sm"
                            >
                                {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
