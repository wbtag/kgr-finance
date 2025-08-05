'use client'

import Tagify from "@yaireo/tagify";
import { useEffect, useState, useRef } from "react"
import { getReceipts, getSpend, getTags } from "../lib/mongoLibrary";
import { getColumns } from './columns';
import { DataTable } from "./data-table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function SpendQuery() {

    const router = useRouter();

    const [queryData, setQueryData] = useState({
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        tags: []
    });

    const [spend, setSpend] = useState(0);
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [tags, setTags] = useState([]);

    const fetchTags = async () => {
        const tags = await getTags();
        setTags(tags);
        tagify.current.whitelist = tags;
    };

    const tagify = useRef(null);

    useEffect(() => {
        const inputElem = window.document.querySelector('input[name=tags]');
        tagify.current = new Tagify(inputElem, {
            whitelist: tags,
            dropdown: {
                enabled: 0,
                maxItems: 5,
                position: "text",
                closeOnSelect: false,
                highlightFirst: true
            }
        });
        fetchTags();
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

    const goHome = () => {
        router.push('/');
    }

    return (
        <>
            <button className="nav-button button" onClick={goHome}>&lt; Zpět na přehled</button>
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
                {receipts.length > 0 ?
                    <div>
                        <h1>Celková útrata: {spend} Kč</h1>
                        <DataTable columns={getColumns(setSelectedReceipt)} data={receipts} />

                        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
                            <DialogTitle>
                                Detail
                            </DialogTitle>
                            <DialogContent>
                                <p>{JSON.stringify(selectedReceipt)}</p>
                            </DialogContent>
                        </Dialog>
                    </div> :
                    <div>
                        <p>Žádné výsledky.</p>
                    </div>
                }

            </div>
        </>
    )
}