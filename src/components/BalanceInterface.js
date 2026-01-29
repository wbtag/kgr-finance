'use client'
import { useEffect, useState } from "react";
import { getBalance, logNewBalance, logIncome } from "./lib/mongoLibrary";
import AnimateValue from "./lib/animateValue";
import { Select, Input } from "./ui/formElements";
import { useStateHandler } from "./lib/useStateHandler";

export default function BalanceInterface() {

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
    };

    const fetchBalance = async () => {
        const balanceData = await getBalance();
        setBalanceData(balanceData);
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    const balanceInitialState = {
        balance: 0
    };

    const balanceStateHandler = useStateHandler(balanceInitialState);

    const incomeInitialState = {
        amount: 0,
        description: '',
        type: ''
    };

    const incomeStateHandler = useStateHandler(incomeInitialState);

    const submitForm = async (e) => {
        e.preventDefault();

        const formId = e.target.form?.id;

        if (formId === 'balance') {
            const newBalanceData = await logNewBalance(balanceStateHandler.formData.balance, balanceData.estimatedBalance);
            setBalanceData({
                ...newBalanceData,
                incomeSinceLastBalance: 0
            });
        } else if (formId === 'income') {
            const formData = incomeStateHandler.formData;
            await logIncome(formData);
            setBalanceData((prevState) => ({
                ...prevState,
                incomeSinceLastBalance: parseInt(balanceData.incomeSinceLastBalance) + parseInt(formData.amount),
                estimatedBalance: parseInt(balanceData.estimatedBalance) + parseInt(formData.amount)
            }))
        }
    };

    const incomeTypes = ["Výplata", "Dar", "Přeplatek", "Úroky", "Jiné"];

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
                        <p className="text-xl">Nový příjem</p>
                        <Select label="Typ" options={incomeTypes} blankOption={true} name="type" handler={incomeStateHandler} />
                        <Input label="Popis" name="description" handler={incomeStateHandler} />
                        <Input label="Částka" name="amount" type="number" handler={incomeStateHandler} />
                        <button className="button mt-3" onClick={submitForm}>Uložit</button>
                    </form>
                    <form className="my-3 w-80" id="balance">
                        <p className="text-xl">Aktualizace zůstatku</p>
                        <Input label="Nový zůstatek" type="number" name="balance" handler={balanceStateHandler} />
                        <button className="button mt-3" onClick={submitForm}>Uložit</button>
                    </form>
                </div>
            </div>
        </>
    )
}