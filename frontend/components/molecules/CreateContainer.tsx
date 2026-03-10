'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import client from '@/lib/graphql-request';
import { CREATE_SESSION } from '@/lib/mutations';

const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export default function CreateContainer() {
    const [name, setName] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [dietaryPreference, setDietaryPreference] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim() || !dietaryPreference) return;

        setLoading(true);

        try {
            const data: any = await client.request(CREATE_SESSION, {
                displayName: name.trim(),
                dietaryPreference,
            });
            const { session, member, success, token } = data.createSession;

            if (!success) {
                console.error('Failed to create session');
                return;
            }

            localStorage.setItem('token', token); 
            localStorage.setItem('memberId', member.id);
            localStorage.setItem('sessionId', session.id);
            localStorage.setItem('displayName', name.trim());
            localStorage.setItem('dietaryPreference', dietaryPreference);

            // try/catch in case receipt upload mutation does not work yet
            if (receiptFile) {
                try {
                    const base64 = await toBase64(receiptFile);
                    const uploadData: any = await client.request(UPLOAD_RECEIPT, {
                        sessionId: session.id,
                        fileBase64: base64,
                        fileName: receiptFile.name,
                    });

                    const { success, jobId, message: uploadMessage } = uploadData.uploadReceipt;
                    if (!success) {
                        console.error('Upload failed:', uploadMessage);
                    }
                } catch (uploadErr) {
                    // Mutation not live yet — log and continue to receipt page anyway
                    console.warn('uploadReceipt not available yet:', uploadErr);
                }
            }

            router.push(`/receipt/${session.id}`);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                        <label htmlFor="receipt-file" className="mb-2 block text-sm font-semibold sm:text-base">
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

                    <div>
                        <label htmlFor="dietary-preference-create" className="mb-2 block text-sm font-semibold sm:text-base">
                            Dietary Preference
                        </label>
                        <select
                            id="dietary-preference-create"
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
                        {loading ? 'Creating...' : 'Create Session'}
                    </button>
                </div>
            </form>
        </div>
    );
}