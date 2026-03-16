'use client'

import { useEffect, useState } from "react";
import { getMonthlySpendByCategory, getWeeklySpendByCategory, getBalance } from "./lib/mongoLibrary";
import AnimateValue from "./lib/animateValue";
import SpendTable from "./spendOverview/SpendTable";
import Switcher from "./Switcher";
import Link from "next/link";

export default function SpendInterface() {

    const [weeklySpend, setWeeklySpend] = useState(0);
    const [weeklyOtherSpend, setWeeklyOtherSpend] = useState(0);
    const [weeklySpendByCategory, setWeeklySpendByCategory] = useState({});

    const [monthlySpend, setMonthlySpend] = useState(0);
    const [monthlyOtherSpend, setMonthlyOtherSpend] = useState(0);
    const [monthlySpendByCategory, setMonthlySpendByCategory] = useState({});

    const [balance, setBalance] = useState(0);

    const animatedBalance = AnimateValue(balance);
    const animatedWeeklySpend = AnimateValue(weeklySpend);
    const animatedMonthlySpend = AnimateValue(monthlySpend);

    const [spendPeriod, setSpendPeriod] = useState('week');

    const fetchSpend = async () => {
        const monthlySpend = await getMonthlySpendByCategory();
        setMonthlySpend(monthlySpend.totalSpend);
        setMonthlySpendByCategory(monthlySpend.categories);
        setMonthlyOtherSpend(monthlySpend.other);
        const weeklySpend = await getWeeklySpendByCategory();
        setWeeklySpend(weeklySpend.totalSpend);
        setWeeklySpendByCategory(weeklySpend.categories);
        setWeeklyOtherSpend(weeklySpend.other);
    }

    const fetchBalance = async () => {
        const balance = await getBalance(true);
        setBalance(balance);
    }

    useEffect(() => {
        fetchSpend();
        fetchBalance();
    }, []);

    const handleSpendPeriodChange = (e) => { setSpendPeriod(e.target.name) }

    return (
        <>
            <div>
                <div className="flex flex-wrap md:my-4 justify-center">
                    <div className="my-2 w-80 text-center">
                        <p className="text-3xl">{animatedWeeklySpend.toFixed()} Kč</p>
                        <p>Útrata tento týden</p>
                    </div>
                    <div className="my-2 w-80 text-center">
                        <p className="text-3xl">{animatedMonthlySpend.toFixed()} Kč</p>
                        <p>Útrata tento měsíc</p>
                    </div>
                    <div className="my-2 w-80 text-center">
                        <Link href="/balance">
                            <p className="text-3xl">{animatedBalance.toFixed()} Kč</p>
                            <p className="">Aktuální odhadovaný zůstatek</p>
                        </Link>
                    </div>
                </div>
                <div className="grid justify-center">
                    <div className='inline-flex py-5 gap-x-1 w-80 justify-center'>
                        <Switcher name='week' text='Týden' stateTracker={spendPeriod} changeHandler={handleSpendPeriodChange}/>
                        <Switcher name='month' text='Měsíc' stateTracker={spendPeriod} changeHandler={handleSpendPeriodChange}/>
                    </div>
                    <div className="pb-4">
                        {spendPeriod === 'week' ?
                            <div>
                                <SpendTable source={weeklySpendByCategory} other={weeklyOtherSpend} />
                            </div> :
                            <div>
                                <SpendTable source={monthlySpendByCategory} other={monthlyOtherSpend} />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    )
}