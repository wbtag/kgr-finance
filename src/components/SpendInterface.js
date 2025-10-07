'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMonthlySpendByCategory, getWeeklySpendByCategory } from "./lib/mongoLibrary";
import SpendTable from "./spendOverview/SpendTable";

export default function SpendInterface() {

    const router = useRouter();

    const [weeklySpend, setWeeklySpend] = useState(0);
    const [weeklyOtherSpend, setWeeklyOtherSpend] = useState(0);
    const [weeklySpendByCategory, setWeeklySpendByCategory] = useState({});
    
    const [monthlySpend, setMonthlySpend] = useState(0);
    const [monthlyOtherSpend, setMonthlyOtherSpend] = useState(0);
    const [monthlySpendByCategory, setMonthlySpendByCategory] = useState({});

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

    const goToReceiptInterface = () => {
        router.push('/receipt');
    };

    useEffect(() => {
        fetchSpend();
    }, []);

    const goToQueryInterface = () => {
        router.push('/query');
    };

    const handleSpendPeriodChange = (e) => { setSpendPeriod(e.target.name) }

    const Switcher = ({ name, text }) => {
        return <button className={`button ${spendPeriod === name ? 'button-group-active' : ''}`} name={name} onClick={handleSpendPeriodChange}>{text}</button>
    }

    return (
        <>
            <div>
                <div className="pl-10">
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

                    <div className="inline-flex py-2 gap-x-2">
                        <button className="button px-1" onClick={goToReceiptInterface}>Nová útrata</button>
                        <button className="button" onClick={goToQueryInterface}>Přehled útrat</button>
                    </div>
                </div>
            </div>
        </>
    )
}