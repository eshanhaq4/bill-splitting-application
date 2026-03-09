'use client';

import { useState } from 'react';

interface CreateContainerProps {
    onCreateSession?: (payload: { name: string; receiptFile: File | null }) => void;
}

export default function CreateContainer({ onCreateSession }: CreateContainerProps) {
    const [name, setName] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        onCreateSession?.({ name: name.trim(), receiptFile });
    };

    return (
        <div className="mt-6 flex w-full items-center justify-center sm:mt-8">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-800 p-5 text-white shadow-xl sm:p-6"
            >
                <div className="space-y-5">
                    <div>
                        <label htmlFor="group-name" className="mb-2 block text-sm font-semibold sm:text-base">
                            Name
                        </label>
                        <input
                            id="group-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Enter your name"
                            className="w-full rounded-lg border-2 border-emerald-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 sm:text-base"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="receipt-file"
                            className="mb-2 block text-sm font-semibold sm:text-base"
                        >
                            Upload Receipt
                        </label>
                        <input
                            id="receipt-file"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(event) => setReceiptFile(event.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-50 file:transition"
                        />
                        <p className="mt-2 min-h-5 text-xs text-emerald-100 sm:text-sm">
                            {receiptFile ? `Selected: ${receiptFile.name}` : 'No file selected'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] sm:text-base"
                    >
                        Create Session
                    </button>
                </div>
            </form>
        </div>
    );
}