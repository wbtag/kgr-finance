'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { request } from "./lib/request";

export default function SpendInterface() {

    const router = useRouter();

    const [weeklySpend, setWeeklySpend] = useState('');
    const [remainingSpend, setRemainingSpend] = useState('');
    const dayOfWeek = new Date().getDay();

    const getWeeklySpend = async () => {
        const response = await request(`${process.env.NEXT_PUBLIC_FUNCTIONS_DOMAIN}/api/spend/weekly`, 'GET', {}, null);
        setWeeklySpend(response.spend);
        setRemainingSpend(4200 - response.spend);
    }

    const goToReceiptInterface = () => {
        router.push('/receipt');
    }

    useEffect(() => {
        getWeeklySpend()
    }, []);

    return (
        <>
            <div>
                {weeklySpend && typeof weeklySpend === 'number' ?
                    <div className="pad">
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

    const getRecentReceipts = async () => {
        const response = await request(`${process.env['NEXT_PUBLIC_FUNCTIONS_DOMAIN']}/api/receipts/recent`);
        setReceipts(response);
    };

    useEffect(() => {
        getRecentReceipts();
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