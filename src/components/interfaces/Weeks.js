'use client'

import { useEffect, useState } from "react";
import { getSpendByWeek } from "../lib/mongoLibrary";
import Link from "next/link";

export default function Weeks() {

    const [weeks, setWeeks] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());

    const getWeeks = async () => {
        const weeks = await getSpendByWeek(year);
        setWeeks(weeks);
    };

    useEffect(() => {
        getWeeks();
    }, []);

    return (
        <>
            <div className="pad pad-vertical">
                <h1 className="text-2xl pb-5">Týdenní přehled {year}</h1>
                {weeks.map(week => (
                    <div key={week._id}>
                        {week._id}. týden: {week.amount} Kč 
                        <Link href={`/weekly-summary/week/${year}/${week._id}`}>Detail</Link>
                    </div>
                ))}
            </div>
        </>
    )
}