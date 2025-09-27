'use client'

import Tagify from "@yaireo/tagify";
import { useEffect, useState, useRef } from "react"
import { getReceipts, getSpend, getTags } from "../lib/mongoLibrary";
import { DataTable, getColumns } from "./QueryTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function SpendQuery() {

    const router = useRouter();

    const [queryData, setQueryData] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        tags: []
    });

    const [timeframe, setTimeframe] = useState('week');

    const changeTimeframe = (e) => {

        setTimeframe(e.target.value);

        let from, to;

        if (e.target.value != 'custom') {

            const date = new Date();
            from = new Date();

            switch (e.target.value) {
                case "week":
                    from.setDate(date.getDate() - date.getDay());
                    break;
                case "weekToDate":
                    from.setDate(date.getDate() - 6);
                    break;
                case "month":
                    from.setDate(1);
                    break;
                case "monthToDate":
                    from.setMonth(date.getMonth() - 1);
                    break;
            };

            from = from.toISOString().split('T')[0];
            to = date.toISOString().split('T')[0];

            query({ from, to });

        } else {
            from = queryData.from;
            to = queryData.to;
        };

        setQueryData({
            from,
            to,
            tags: queryData.tags
        });
    };

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
        query();
    }, []);

    const query = async (input) => {

        let from = queryData.from;
        let to = queryData.to;

        if (input && input.preventDefault) {
            input.preventDefault();
        } else if (input && input.from && input.to) {
            from = input.from;
            to = input.to;
        };

        const spend = await getSpend({ from, to }, queryData.tags);
        setSpend(spend);
        const receipts = await getReceipts({ from, to }, queryData.tags, 0, 200);
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
            <div className="pad pad-top min-margin">
                <form className="form" onSubmit={query}>
                    <label className="w-2">Časový úsek</label>
                    <select className="py-0" name="timeframe" id="timeframe" onChange={(e) => changeTimeframe(e)}>
                        <option value="week">Tento týden</option>
                        <option value="weekToDate">Posledních 7 dní</option>
                        <option value="month">Tento měsíc</option>
                        <option value="monthToDate">Posledních 30 dní</option>
                        <option value="custom">Vlastní</option>
                    </select>
                    {timeframe === 'custom' ?
                        <div>
                            <label className="min-margin">Datum od</label>
                            <input type="date" value={queryData.from} name="from" onChange={handleInput}></input>
                            <label className="min-margin">Datum do</label>
                            <input type="date" value={queryData.to} name="to" onChange={handleInput}></input>
                        </div> : <div />
                    }
                    <label className="">Značky</label>
                    <input name="tags" value={queryData.tags} onChange={handleInput}></input>
                    <button className="min-margin" type="submit">OK</button>
                </form>
                {receipts.length > 0 ?
                    <div>
                        <h1>Celková útrata: {spend} Kč</h1>
                        <DataTable columns={getColumns(setSelectedReceipt)} data={receipts} />

                        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
                            <DialogContent className="fixed bg-white dark:bg-gray-900 text-black dark:text-white p-6 shadow-lg overflow-auto">
                                <DialogTitle className="text-xl font-semibold mb-2">Detail</DialogTitle>
                                <p>Popis: {selectedReceipt?.description}</p>
                                <p>Částka: {selectedReceipt?.amount}</p>
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