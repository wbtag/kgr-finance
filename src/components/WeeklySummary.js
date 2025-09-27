'use client'

import { useEffect, useState } from "react";
import { getSpendByWeek } from "./lib/mongoLibrary";
import Link from "next/link";

export default function WeeklySummary() {

    const [weeks, setWeeks] = useState([]);

    const getWeeks = async () => {
        const weeks = await getSpendByWeek();
        setWeeks(weeks);
    };

    useEffect(() => {
        getWeeks();
    }, []);

    return (
        <>
            <div className="pad pad-vertical">
                <h1>Týdenní přehled</h1>
                {weeks.map(week => (
                    <div key={week._id}>
                        {week._id.split('-')[0]}. týden roku {week._id.split('-')[1]}: {week.amount} Kč 
                        <Link href={`/weekly-summary/week/${week._id}`}>Detail</Link>
                    </div>
                ))}
            </div>
        </>
    )
}