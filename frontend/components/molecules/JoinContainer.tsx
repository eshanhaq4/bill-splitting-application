'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import client from '@/lib/graphql-request';
import { JOIN_SESSION } from '@/lib/mutations';

export default function JoinContainer() {
    const [name, setName] = useState('');
    const [dietaryPreference, setDietaryPreference] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const sessionId = params?.id as string;

    useEffect(() => {
        const prefilledName = searchParams.get('name');
        if (prefilledName) {
            setName(prefilledName);
        }
    }, [searchParams]);

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim() || !sessionId || !dietaryPreference) return;

        setLoading(true);

        try {
            const data: any = await client.request(JOIN_SESSION, {
                sessionId,
                displayName: name.trim(),
                dietaryPreference,
            });

            const { session, member, success } = data.joinSession;

            if (!success) {
                console.error('Join failed');
                return;
            }

            localStorage.setItem('token', data.joinSession.token);
            localStorage.setItem('memberId', member.id);
            localStorage.setItem('sessionId', session.id);
            localStorage.setItem('displayName', name.trim());
            localStorage.setItem('dietaryPreference', dietaryPreference);

            router.push(`/receipt/${session.id}`);
        } catch (err) {
            console.error('Join error:', err);
        } finally {
            setLoading(false);
        }
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

                    <div>
                        <label htmlFor="dietary-preference-join" className="mb-2 block text-sm font-semibold sm:text-base">
                            Dietary Preference
                        </label>
                        <select
                            id="dietary-preference-join"
                            value={dietaryPreference}
                            onChange={(event) => setDietaryPreference(event.target.value)}
                            className="w-full rounded-lg border-2 border-emerald-500 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 sm:text-base"
                            required
                        >
                            <option value="" disabled>Select one option</option>
                            <option value="NONE">None</option>
                            <option value="VEGETARIAN">Vegetarian</option>
                            <option value="VEGAN">Vegan</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !name.trim() || !dietaryPreference}
                        className="w-full rounded-lg bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
                    >
                        {loading ? 'Joining...' : 'Join Session'}
                    </button>
                </div>
            </form>
        </div>
    );
}