'use client'
import { useEffect, useState } from "react";
import { getBalance, logNewBalance, logIncome } from "./lib/mongoLibrary";
import AnimateValue from "./lib/animateValue";

export default function BalanceInterface(params) {

    const [balanceData, setBalanceData] = useState({
        lastBalance: 0,
        lastBalanceDate: 0,
        estimatedBalance: 0,
        spendSinceLastBalance: 0,
        incomeSinceLastBalance: 0
    });

    const lastBalance = AnimateValue(balanceData.lastBalance);
    const estimatedBalance = AnimateValue(balanceData.estimatedBalance);
    const spendSinceLastBalance = AnimateValue(balanceData.spendSinceLastBalance);
    const incomeSinceLastBalance = AnimateValue(balanceData.incomeSinceLastBalance)

    const formattedBalanceDate = () => {
        const lastBalanceDate = balanceData.lastBalanceDate === 0 ? Date.now() : balanceData.lastBalanceDate;
        const date = new Date(lastBalanceDate).toLocaleString('cs-CZ');
        return date.substring(0, date.length - 3);
    }

    const [newBalance, setNewBalance] = useState(0);

    const [incomeFormData, setIncomeFormData] = useState({
        amount: 0,
        description: '',
        type: ''
    });

    const fetchBalance = async () => {
        const balanceData = await getBalance();
        setBalanceData(balanceData);
    }

    useEffect(() => {
        fetchBalance();
    }, []);

    const handleInput = (e) => {
        const form = e.target.form?.id;

        if (form === 'balance') {
            setNewBalance(e.target.value);
        } else if (form === 'income') {
            const { name, value } = e.target;
            setIncomeFormData((prevState) => ({
                ...prevState,
                [name]: value
            }));
        }

    };

    const submitForm = async (e) => {
        e.preventDefault();

        const formId = e.target.form?.id;

        if (formId === 'balance') {
            const newBalanceData = await logNewBalance(newBalance, balanceData.estimatedBalance);
            setBalanceData(newBalanceData);
        } else if (formId === 'income') {
            await logIncome(incomeFormData);
            setBalanceData((prevState) => ({
                ...prevState,
                lastBalance: parseInt(balanceData.lastBalance) + parseInt(incomeFormData.amount),
                estimatedBalance: parseInt(balanceData.estimatedBalance) + parseInt(incomeFormData.amount)
            }))
        }
    };

    return (
        <>
            <div className="mt-4">
                <div className="flex flex-wrap gap-2 w-full justify-center">
                    <div className="w-80 text-center">
                        <p className="text-3xl">{estimatedBalance.toFixed()} Kč</p>
                        <p className="">Aktuální odhadovaný zůstatek</p>
                    </div>
                    <div className="w-80 text-center">
                        <p className="text-3xl">{incomeSinceLastBalance.toFixed()} Kč</p>
                        <p className="">Příjmy od poslední aktualizace</p>
                    </div>
                    <div className="w-80 text-center">
                        <p className="text-3xl">{spendSinceLastBalance.toFixed()} Kč</p>
                        <p className="">Útrata od poslední aktualizace</p>
                    </div>
                    <div className="w-80 text-center">
                        <p className="text-3xl">{lastBalance.toFixed()} Kč</p>
                        <p className="">Zůstatek k {formattedBalanceDate()}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 ml-12 w-full md:justify-center">
                    <form className="my-3 w-100" id="income">
                        <p className="text-xl pb-3">Nový příjem</p>
                        <div className="flex flex-row">
                            <label className="w-20">Typ</label>
                            <select name="type" value={incomeFormData.type} onChange={handleInput} className="py-0">
                                <option value=""></option>
                                <option value="Výplata">Výplata</option>
                                <option value="Dar">Dar</option>
                                <option value="Přeplatek">Přeplatek</option>
                                <option value="Úroky">Úroky</option>
                                <option value="Jiné">Jiné</option>
                            </select>
                        </div>
                        <div className="flex flex-row">
                            <label className="w-20">Popis</label>
                            <input type="text" name="description" value={incomeFormData.description} onChange={handleInput}></input>
                        </div>
                        <div className="flex flex-row">
                            <label className="w-20">Částka</label>
                            <input type="number" name="amount" value={incomeFormData.amount} onChange={handleInput}></input>
                        </div>
                        <button className="button mt-2" onClick={submitForm}>Odeslat</button>
                    </form>
                    <form className="my-3 w-80" id="balance">
                        <p className="text-xl pb-3">Aktualizace zůstatku</p>
                        <div className="flex flex-row items-center">
                            <label className="w-25">Nový zůstatek</label>
                            <input className="w-20" type="number" name="newBalance" value={newBalance} onChange={handleInput}></input>
                            <button className="button" onClick={submitForm}>Uložit</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}