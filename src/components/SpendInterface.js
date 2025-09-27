'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecentReceipts, getMonthlySpendByCategory, getWeeklySpendByCategory } from "./lib/mongoLibrary";
import SpendTable from "./spendOverview/SpendTable";

export default function SpendInterface() {

    const router = useRouter();

    // const [cleanWeeklySpend, setCleanWeeklySpend] = useState(0);
    // const [fullWeeklySpend, setFullWeeklySpend] = useState(0);
    const [weeklySpend, setWeeklySpend] = useState(0);
    const [weeklyOtherSpend, setWeeklyOtherSpend] = useState(0);
    const [weeklySpendByCategory, setWeeklySpendByCategory] = useState({});
    
    const [monthlySpend, setMonthlySpend] = useState(0);
    const [monthlyOtherSpend, setMonthlyOtherSpend] = useState(0);
    const [monthlySpendByCategory, setMonthlySpendByCategory] = useState({});

    const [spendPeriod, setSpendPeriod] = useState('week');

    const fetchSpend = async () => {
        // const spend = await getWeeklySpend();
        // setCleanWeeklySpend(spend.cleanWeeklySpend);
        // setFullWeeklySpend(spend.fullWeeklySpend);
        const monthlySpend = await getMonthlySpendByCategory();
        setMonthlySpend(monthlySpend.totalSpend);
        setMonthlySpendByCategory(monthlySpend.categories);
        setMonthlyOtherSpend(monthlySpend.other);
        const weeklySpend = await getWeeklySpendByCategory();
        setWeeklySpend(weeklySpend.totalSpend);
        setWeeklySpendByCategory(weeklySpend.categories);
        setWeeklyOtherSpend(weeklySpend.other);
    }

    // const dayOfWeek = new Date().getDay();
    // const remainingSpend = 4200 - cleanWeeklySpend;

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
                    {/* <p>Náklady za tento týden: {cleanWeeklySpend} Kč ({fullWeeklySpend} Kč)</p>
                    <p>Zbývá tento týden: {remainingSpend} Kč</p>
                    <p>Denní limit: {(remainingSpend / (7 - dayOfWeek)).toFixed(2)} Kč</p> */}
                    {/* <RecentReceipts /> */}
                    <div className='inline-flex py-5'>
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

                    <div className="inline-flex py-2">
                        <button className="button min-margin" onClick={goToReceiptInterface}>Nová útrata</button>
                        <button className="button min-margin" onClick={goToQueryInterface}>Přehled útrat</button>
                    </div>
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
            <div className="py-2">
                <p>Nejnovější položky:</p>
                {receipts.map((receipt) => (
                    <div key={receipt.id}>
                        <p>{new Date(receipt.date).toISOString().split('T')[0]} - {receipt.description}, {receipt.amount} Kč</p>
                    </div>
                ))}
            </div>
        </>
    )
}