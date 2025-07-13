'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecentReceipts } from "./lib/cosmosLibrary";

export default function SpendInterface({weeklySpend}) {

    const router = useRouter();

    const dayOfWeek = new Date().getDay();
    const remainingSpend = 4200 - weeklySpend;

    const goToReceiptInterface = () => {
        router.push('/receipt');
    }

    return (
        <>
            <div>
                {weeklySpend && typeof weeklySpend === 'number' ?
                    <div className="pad pad-top">
                        <p>Náklady za tento týden: {weeklySpend} Kč</p>
                        <p>Zbývá tento týden: {remainingSpend} Kč</p>
                        <p>Denní limit: {(remainingSpend / (7 - dayOfWeek)).toFixed(2)} Kč</p>
                        <button className="button" onClick={goToReceiptInterface}>Zadat novou útratu</button>
                        <RecentReceipts />
                    </div>
                    : <div>
                        <p>Načítá se...</p>
                    </div>
                }

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