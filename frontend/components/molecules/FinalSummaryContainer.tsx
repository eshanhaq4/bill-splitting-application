interface FinalSummaryRow {
    memberId: string;
    memberName: string;
    claimedItemsCount: number;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
}

interface FinalSummaryContainerProps {
    rows: FinalSummaryRow[];
}

export default function FinalSummaryContainer({ rows }: FinalSummaryContainerProps) {
    return (
        <div className="mt-8 flex w-full justify-center">
            <section className="w-full max-w-3xl rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-800 p-5 text-white shadow-xl sm:p-6">
                <h2 className="text-lg font-bold sm:text-xl">Summary</h2>
                <div className="mt-3 h-px w-full bg-emerald-400/50" />

                <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-[28rem] text-left text-sm sm:text-base">
                        <thead>
                            <tr className="border-b border-emerald-400/50 text-emerald-100">
                                <th scope="col" className="px-2 py-3 font-bold sm:px-3">Member</th>
                                <th scope="col" className="px-2 py-3 text-center font-bold sm:px-3">Items</th>
                                <th scope="col" className="px-2 py-3 text-right font-bold sm:px-3">Subtotal</th>
                                <th scope="col" className="px-2 py-3 text-right font-bold sm:px-3">Tax</th>
                                <th scope="col" className="px-2 py-3 text-right font-bold sm:px-3">Tip</th>
                                <th scope="col" className="px-2 py-3 text-right font-bold sm:px-3">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.memberId}
                                    className={`border-b sm:px-3 ${
                                        row.memberId === 'unclaimed'
                                            ? 'border-b-2 border-emerald-300 bg-emerald-900/30 font-bold'
                                            : 'border-emerald-400/20 last:border-b-0'
                                    }`}
                                >
                                    <td className={`px-2 py-3 font-semibold sm:px-3 ${row.memberId === 'unclaimed' ? 'text-emerald-100' : ''}`}>
                                        {row.memberName}
                                    </td>
                                    <td className={`px-2 py-3 text-center font-semibold sm:px-3 ${row.memberId === 'unclaimed' ? 'text-emerald-100' : ''}`}>
                                        {row.claimedItemsCount}
                                    </td>
                                    <td className={`px-2 py-3 text-right font-semibold sm:px-3 ${row.memberId === 'unclaimed' ? 'text-emerald-100' : ''}`}>
                                        ${row.subtotal.toFixed(2)}
                                    </td>
                                    <td className={`px-2 py-3 text-right font-semibold sm:px-3 ${row.memberId === 'unclaimed' ? 'text-emerald-100' : 'text-emerald-200'}`}>
                                        ${row.tax.toFixed(2)}
                                    </td>
                                    <td className={`px-2 py-3 text-right font-semibold sm:px-3 ${row.memberId === 'unclaimed' ? 'text-emerald-100' : 'text-emerald-200'}`}>
                                        ${row.tip.toFixed(2)}
                                    </td>
                                    <td className={`px-2 py-3 text-right font-bold sm:px-3 ${row.memberId === 'unclaimed' ? 'text-emerald-100' : ''}`}>
                                        ${row.total.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}