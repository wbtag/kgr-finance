'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMonthlySpendByCategory, getWeeklySpendByCategory, getCurrentBalance } from "./lib/mongoLibrary";
import SpendTable from "./spendOverview/SpendTable";
import Link from "next/link";

export default function SpendInterface() {

    const router = useRouter();

    const [weeklySpend, setWeeklySpend] = useState(0);
    const [weeklyOtherSpend, setWeeklyOtherSpend] = useState(0);
    const [weeklySpendByCategory, setWeeklySpendByCategory] = useState({});

    const [monthlySpend, setMonthlySpend] = useState(0);
    const [monthlyOtherSpend, setMonthlyOtherSpend] = useState(0);
    const [monthlySpendByCategory, setMonthlySpendByCategory] = useState({});

    const [balance, setBalance] = useState(0);

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
        const balance = await getCurrentBalance();
        setBalance(balance);
    }

    useEffect(() => {
        fetchSpend();
        fetchBalance();
    }, []);

    const handleSpendPeriodChange = (e) => { setSpendPeriod(e.target.name) }

    const Switcher = ({ name, text }) => {
        return <button className={`button ${spendPeriod === name ? 'button-group-active' : ''}`} name={name} onClick={handleSpendPeriodChange}>{text}</button>
    }

    return (
        <>
            <div>
                <div className="pl-12">
                    <div className="flex flex-wrap gap-2 pt-4">
                        <div className="p-8 w-80 border border-solid border-white rounded-lg">
                            <p className="text-3xl text-center">{weeklySpend} Kč</p>
                            <p className="text-center">Útrata tento týden</p>
                        </div>
                        <div className="p-8 w-80 text-center border border-solid border-white rounded-lg">
                            <p className="text-3xl text-center">{monthlySpend} Kč</p>
                            <p className="text-center">Útrata tento měsíc</p>
                        </div>
                        <div className="p-8 w-80 border border-solid border-white rounded-lg">
                            <Link href="/balance"> 
                                <p className="text-3xl text-center">{balance} Kč</p>
                                <p className="text-center">Aktuální odhadovaný zůstatek</p>
                            </Link>
                        </div>
                    </div>
                    <div className='inline-flex py-5 gap-x-1'>
                        <Switcher name='week' text='Tento týden' />
                        <Switcher name='month' text='Tento měsíc' />
                    </div>
                    {spendPeriod === 'week' ?
                        <div>
                            <SpendTable source={weeklySpendByCategory} other={weeklyOtherSpend} sum={weeklySpend} />
                        </div> :
                        <div>
                            <SpendTable source={monthlySpendByCategory} other={monthlyOtherSpend} sum={monthlySpend} />
                        </div>
                    }
                </div>
            </div>
        </>
    )
}