'use client';

import { useState } from 'react';
import QRCodeModal from '@/components/atoms/QRCodeModal';

export interface ReceiptMemberPresence {
    id: string;
    initials: string;
    colorClass: string;
    isConnected: boolean;
}

interface ReceiptHeaderProps {
    members: ReceiptMemberPresence[];
    qrCodeUrl: string;
}

export default function ReceiptHeader({ members, qrCodeUrl }: ReceiptHeaderProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <header className="sticky top-0 z-30 w-full border-b border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 shadow-md sm:px-6">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <h1 className="text-lg font-bold text-white sm:text-xl">Bill Split</h1>


                <div className="flex items-center gap-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm ${
                                member.isConnected ? member.colorClass : 'bg-gray-400'
                            }`}
                            title={member.isConnected ? 'Connected' : 'Disconnected'}
                        >
                            {member.initials}
                        </div>
                    ))}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 hover:scale-110 sm:h-10 sm:w-10"
                        aria-label="Show QR Code"
                        title="Show QR Code"
                    >
                        <svg
                            className="h-5 w-5 sm:h-6 sm:w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            <QRCodeModal
                qrCodeUrl={qrCodeUrl}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </header>
    );
}
