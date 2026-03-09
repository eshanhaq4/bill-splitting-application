'use client';

import { useState } from 'react';

interface JoinContainerProps {
    onJoinSession?: (payload: { name: string }) => void;
}

export default function JoinContainer({ onJoinSession }: JoinContainerProps) {
    const [name, setName] = useState('');

    const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        onJoinSession?.({ name: name.trim() });
    };

    return (
        <div className="flex w-full items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-800 p-5 text-white shadow-xl sm:p-6"
            >
                <div className="space-y-5">
                    <div>
                        <label htmlFor="join-name" className="mb-2 block text-sm font-semibold sm:text-base">
                            Name
                        </label>
                        <input
                            id="join-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Enter your name"
                            className="w-full rounded-lg border-2 border-emerald-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 sm:text-base"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] sm:text-base"
                    >
                        Join Session
                    </button>
                </div>
            </form>
        </div>
    );
}