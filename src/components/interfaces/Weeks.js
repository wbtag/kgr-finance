'use client'

import { useEffect, useState } from "react";
import { getSpendByWeek, getYears } from "../lib/mongoLibrary";
import Link from "next/link";
import { Select } from "../ui/elements/formElements";

export default function Weeks() {
    const [weeks, setWeeks] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]);

    const fetchYears = async () => {
        const years = await getYears();
        setYears(years);
    };

    const getWeeks = async (year) => {
        const weeks = await getSpendByWeek(year);
        setWeeks(weeks);
    };

    useEffect(() => {
        fetchYears();
        getWeeks(year);
    }, [year]);

    return (
        <div className="pad pad-vertical max-w-150">
            <h1 className="text-2xl">Týdenní přehled {year}</h1>
            <Select
                value={year}
                changeHandler={(e) => setYear(e.target.value)}
                name="year"
                label="Rok"
                options={years}
            />
            <div className="pt-4">
                {weeks.map(week => (
                    <div
                        key={week._id}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4 py-3 sm:py-3.5 border-b border-white/10"
                    >
                        <p className="text-white/50 text-xs sm:text-sm tabular-nums whitespace-nowrap tracking-wide">
                            {week._id.padStart(2, '0')}. týden
                        </p>
                        <span className="text-white/90 text-sm sm:text-base tabular-nums whitespace-nowrap">
                            {week.amount.toLocaleString("cs-CZ")} Kč
                        </span>
                        <Link
                            href={`/weekly-summary/${year}/${week._id}`}
                            className="text-white/40 hover:text-white/75 text-xs sm:text-sm tracking-wide transition-colors"
                        >
                            Detail →
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}