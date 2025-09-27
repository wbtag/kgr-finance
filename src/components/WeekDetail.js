'use client'

import { useEffect, useState } from "react";
import { getWeeklySpendDetail } from "./lib/mongoLibrary";

export default function WeekDetail({ weekId }) {

    const [receipts, setReceipts] = useState([]);
    const [receiptsExpandedStatus, setReceiptsExpandedStatus] = useState([]);

    const getReceipts = async () => {
        const receipts = await getWeeklySpendDetail(weekId);
        setReceipts(receipts);
        setReceiptsExpandedStatus([])
    }

    useEffect(() => {
        getReceipts();
    }, []);

    return (
        <>
            <div className="pad pad-vertical">
                {receipts.map(receipt => (
                    <div key={receipt.receiptId}>
                        {receipt.description} - {receipt.amount} Kč
                        {receipt.items && receipt.items.length > 0 ?
                            <div>{receipt.items.map(item => (
                                <div key={item.amount}>
                                    {item.amount}
                                </div>
                            ))}</div>
                            : <div />
                        }
                    </div>
                ))}
            </div>
        </>
    )
}