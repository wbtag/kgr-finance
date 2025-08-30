'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecentReceipts, getWeeklySpend } from "./lib/mongoLibrary";

export default function SpendInterface() {

    const router = useRouter();

    const [weeklySpend, setWeeklySpend] = useState(0);

    const fetchWeeklySpend = async () => {
        const spend = await getWeeklySpend();
        setWeeklySpend(spend);
    }

    const dayOfWeek = new Date().getDay();
    const remainingSpend = 4200 - weeklySpend;

    const goToReceiptInterface = () => {
        router.push('/receipt');
    };

    useEffect(() => {
        fetchWeeklySpend();
    }, []);

    const goToQueryInterface = () => {
        router.push('/query');
    };    

    return (
        <>
            <div>
                <div className="pad">
                    <p>Náklady za tento týden: {weeklySpend} Kč</p>
                    <p>Zbývá tento týden: {remainingSpend} Kč</p>
                    <p>Denní limit: {(remainingSpend / (7 - dayOfWeek)).toFixed(2)} Kč</p>
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                        <button className="button min-margin" onClick={goToReceiptInterface}>Zadat novou účtenku</button>
                        <button className="button min-margin" onClick={goToQueryInterface}>Filtrování účtenek</button>
                    </div>
                    <RecentReceipts />
                </div>
            </div>
        </>
    )
}

function RecentReceipts() {

    const [receipts, setReceipts] = useState([]);

    const getReceipts = async () => {
        const response = await getRecentReceipts();
        setReceipts(response);
    };

    useEffect(() => {
        getReceipts();
    }, []);

    return (
        <>
            <div className="pad-vertical">
                <p>Nejnovější položky:</p>
                {receipts.map((receipt) => (
                    <div key={receipt.receiptId}>
                        <p>{new Date(receipt.date).toISOString().split('T')[0]} - {receipt.description}, {receipt.amount} Kč</p>
                    </div>
                ))}
            </div>
        </>
    )
}