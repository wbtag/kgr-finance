'use client'

import Tagify from "@yaireo/tagify";
import { useEffect, useState } from "react"
import { getReceipts, getSpend } from "../lib/mongoLibrary";
import { getColumns } from './columns';
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function SpendQuery({ tags }) {

    const [queryData, setQueryData] = useState({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        tags: []
    });

    const [spend, setSpend] = useState(0);
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        const inputElem = window.document.querySelector('input[name=tags]');
        const tagify = new Tagify(inputElem, {
            whitelist: tags,
            dropdown: {
                enabled: 0,
                maxItems: 5,
                position: "text",
                closeOnSelect: false,
                highlightFirst: true
            }
        });
    }, []);

    const query = async (e) => {
        e.preventDefault();
        const spend = await getSpend({ from: queryData.dateFrom, to: queryData.dateTo }, queryData.tags);
        setSpend(spend);
        const receipts = await getReceipts({ from: queryData.dateFrom, to: queryData.dateTo }, queryData.tags, 0, 200);
        setReceipts(receipts);
    }

    const handleInput = (e) => {
        const { name, value } = e.target;
        setQueryData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    return (
        <>
            <div className="pad pad-top">
                <form className="form" onSubmit={query}>
                    <label className="min-margin">Datum od</label>
                    <input type="date" value={queryData.dateFrom} name="dateFrom" onChange={handleInput}></input>
                    <label className="min-margin">Datum do</label>
                    <input type="date" value={queryData.dateTo} name="dateTo" onChange={handleInput}></input>
                    <label className="min-margin">Značky</label>
                    <input name="tags" value={queryData.tags} onChange={handleInput}></input>
                    <button className="min-margin" type="submit">OK</button>
                </form>
                <p>{spend}</p>
                <DataTable columns={getColumns(setSelectedReceipt)} data={receipts} />

                <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
                    <DialogTitle>
                        Detail
                    </DialogTitle>
                    <DialogContent>
                        <p>{JSON.stringify(selectedReceipt)}</p>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )
}