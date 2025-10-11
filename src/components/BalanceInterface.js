'use client'
import { useEffect, useState } from "react";
import { getCurrentBalance, updateBalance } from "./lib/mongoLibrary";

export default function BalanceInterface(params) {

    const [balance, setBalance] = useState(0);
    const [formData, setFormData] = useState({
        cashBalance: 0,
        accountBalance: 0
    });

    const fetchBalance = async () => {
        const balance = await getCurrentBalance();
        setBalance(balance);
    }

    useEffect(() => {
        fetchBalance();
    }, []);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const submitForm = async (e) => {
        e.preventDefault();

        try {
            const newBalance = await updateBalance(formData, balance);
            setBalance(newBalance);
            window.alert('Zůstatek aktualizován');
        } catch (e) {
            window.alert(e.message);
        }
    };

    return (
        <>
            <div className="pt-50">
                <p className="text-center text-xl">{balance} Kč</p>
                <p className="text-center">Aktuální odhadovaný zůstatek</p>
                <form className="py-3 max-w-120 pl-3">
                    <p className="text-xl pb-3">Nový stav</p>
                    <div className="flex flex-row">
                        <label className="w-35">Zůstatek v hotovosti</label>
                        <input type="number" name="cashBalance" onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-35">Zůstatek na účtu</label>
                        <input type="number" name="accountBalance" onChange={handleInput}></input>
                    </div>
                    <button className="button" onClick={submitForm}>Uložit</button>
                </form>
            </div>
        </>
    )
}