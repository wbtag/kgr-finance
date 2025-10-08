'use client'

import Tagify from "@yaireo/tagify";
import { useEffect, useState, useRef } from "react"
import { getReceipts, getSpend, getTags } from "../lib/mongoLibrary";
import { DataTable, getColumns } from "./QueryTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { getCategories } from "../lib/getCategories";

export default function SpendQuery() {

    const router = useRouter();

    const [queryData, setQueryData] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        tags: [],
        categories: []
    });

    const queried = useRef(false);

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

            // query({ from, to });

        } else {
            from = queryData.from;
            to = queryData.to;
        };

        setQueryData({
            from,
            to,
            tags: queryData.tags,
            categories: queryData.categories
        });
    };

    const [spend, setSpend] = useState(0);
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    const fetchTags = async () => {
        const tags = await getTags();
        setTags(tags);
        tagify.current.whitelist = tags;
    };


    const fetchCategories = async () => {
        const categories = await getCategories();
        setCategories(categories);
        setQueryData((prevState) => ({
            ...prevState,
            categories
        }));
    }

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
        fetchCategories();
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

        queried.current = true;

        const spend = await getSpend({ from, to }, queryData.tags, queryData.categories);
        setSpend(spend);
        const receipts = await getReceipts({ from, to }, queryData.tags, queryData.categories, 0, 200);
        setReceipts(receipts);
    }

    const handleInput = (e) => {
        const { name, value } = e.target;
        setQueryData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCategoryInput = (category) => {
        setQueryData((prevState) => ({
            ...prevState,
            categories: queryData.categories.includes(category) ? queryData.categories.filter((cat) => cat != category) : [...queryData.categories, category]
        }));
    }

    const goHome = () => {
        router.push('/');
    }

    return (
        <>
            <button className="nav-button button" onClick={goHome}>&lt; Zpět na přehled</button>
            <div className="pad pad-top min-margin">
                <form className="form" onSubmit={query}>
                    <div className="flex flex-row py-1">
                        <label className="w-25">Časový úsek</label>
                        <select className="py-0" name="timeframe" id="timeframe" onChange={(e) => changeTimeframe(e)}>
                            <option value="week">Tento týden</option>
                            <option value="weekToDate">Posledních 7 dní</option>
                            <option value="month">Tento měsíc</option>
                            <option value="monthToDate">Posledních 30 dní</option>
                            <option value="custom">Vlastní</option>
                        </select>
                    </div>
                    {timeframe === 'custom' ?
                        <div className="flex-wrap py-1">
                            <div className="flex flex-row flex-nowrap py-1">
                                <label className="w-25">Datum od</label>
                                <input type="date" value={queryData.from} name="from" onChange={handleInput}></input>
                            </div>
                            <div className="flex flex-row flex-nowrap py-1">
                                <label className="w-25">Datum do</label>
                                <input type="date" value={queryData.to} name="to" onChange={handleInput}></input>
                            </div>
                        </div> : <div />
                    }
                    <div className="flex flex-row">
                        <label className="w-25">Kategorie</label>
                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                            {categories.map((category) => (
                                <button type="button" key={category} onClick={() => handleCategoryInput(category)}
                                    className={`button ${queryData.categories.includes(category) ? "button-group-active" : ""}`}
                                > {category} </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-row py-2">
                        <label className="w-25">Značky</label>
                        <input name="tags" value={queryData.tags} onChange={handleInput}></input>
                        <div className="text-center w-25">
                            <button className="inline-block button py-3" style={{ display: 'inline-block' }} type="submit">Spustit</button>
                        </div>
                    </div>

                </form>
                {queried.current ?
                    <div>
                        {receipts.length > 0 ?
                            <div>
                                <p className="py-2">Celková útrata: {spend} Kč</p>
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
                        }</div> :
                    <div />
                }
            </div >
        </>
    )
}