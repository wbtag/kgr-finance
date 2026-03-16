'use client'

import { useEffect, useState } from "react";
import { useStateHandler } from "../lib/useStateHandler";
import { deleteReceipt, getReceipts, getSpend, getTags } from "../lib/mongoLibrary";
import { DataTable, getColumns } from "./QueryTable";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getCategories } from "../lib/getCategories";
import ReceiptDetail from "./ReceiptDetail";
import { Select, Input } from "../ui/formElements";
import { TagInput } from "../ui/receiptElements";
import Image from "next/image";

export default function SpendQuery() {

    const initialState = {
        from: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        queryTags: [],
        categories: []
    };

    const stateHandler = useStateHandler(initialState);
    const { formData, changeFormData } = stateHandler;

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
        } else {
            from = formData.from;
            to = formData.to;
        };

        changeFormData({
            from,
            to,
            queryTags: formData.queryTags,
            categories: formData.categories
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
    };


    const fetchCategories = async () => {
        const categories = await getCategories();
        categories.push('Mandatorní');
        setCategories(categories);
        changeFormData((prevState) => ({
            ...prevState,
            categories
        }));
    }

    useEffect(() => {
        fetchTags();
        fetchCategories();
        query({ from: formData.from, to: formData.to });
    }, []);

    const query = async (input) => {

        let from = formData.from;
        let to = formData.to;

        if (input && input.preventDefault) {
            input.preventDefault();
        } else if (input && input.from && input.to) {
            from = input.from;
            to = input.to;
        };

        const spend = await getSpend({ from, to }, formData.queryTags, formData.categories);
        setSpend(spend);
        const receipts = await getReceipts({ from, to }, formData.queryTags, formData.categories, 0, 200);
        setReceipts(receipts);
    };

    const handleCategoryInput = (category) => {
        changeFormData((prevState) => ({
            ...prevState,
            categories: formData.categories.includes(category) ? formData.categories.filter((cat) => cat != category) : [...formData.categories, category]
        }));
    };

    const handleDeleteReceipt = async (receipt) => {
        if (window.confirm("Opravdu smazat tuto účtenku?")) {
            const response = await deleteReceipt(receipt.id);
            if (response.ok) {
                window.alert("Smazání účtenky úspěšně dokončeno");
                window.location.reload();
            } else {
                window.alert(response.message);
            }
        }
    }

    const timeframeOptions = [
        { name: "Tento týden", value: "week" },
        { name: "Posledních 7 dní", value: "weekToDate" },
        { name: "Tento měsíc", value: "month" },
        { name: "Posledních 30 dní", value: "monthToDate" },
        { name: "Vlastní", value: "custom" },
    ];

    const handleSelectAllCategories = () => {
        changeFormData((prevState) => ({
            ...prevState,
            categories
        }));
    };

    const handleUnselectAllCategories = () => {
        changeFormData((prevState) => ({
            ...prevState,
            categories: []
        }));
    };

    return (
        <>
            <div className="md:mt-4">
                <form className="form" onSubmit={query}>
                    <div className="ml-12">
                        <div className="flex flex-col">
                            <label className="w-25 mb-1">Kategorie</label>
                            <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                                {categories.map((category) => (
                                    <button type="button" key={category} onClick={() => handleCategoryInput(category)}
                                        className={`button ${formData.categories.includes(category) ? "button-group-active" : ""}`}
                                    > {category} </button>
                                ))}
                                <button className="cursor-pointer" style={{ paddingLeft: '10px' }} onClick={handleSelectAllCategories}>
                                    <Image src="/icons/select-all.svg" alt="Select all" width={18} height={18} />
                                </button>
                                <button className="cursor-pointer" style={{ paddingLeft: '10px' }} onClick={handleUnselectAllCategories}>
                                    <Image src="/icons/unselect-all.svg" alt="Unselect all" width={18} height={18} />
                                </button>
                            </div>

                        </div>
                        <div className="flex flex-row my-2">
                            <Select
                                options={timeframeOptions}
                                handler={stateHandler}
                                changeHandler={changeTimeframe}
                                name="timeframe"
                                label="Časový úsek"
                            />
                        </div>
                        {timeframe === 'custom' ?
                            <div className="flex-wrap">
                                <Input label="Datum od" type="date" name="from" value={formData.from} handler={stateHandler} />
                                <Input label="Datum do" type="date" name="to" value={formData.to} handler={stateHandler} />
                            </div> : <div />
                        }
                        <div className="flex flex-row">
                            <TagInput handler={stateHandler} tags={tags} name="queryTags" />
                        </div>
                    </div>
                    <div className="w-full flex justify-center md:justify-start md:ml-12 mt-4">
                        <button className="button" type="submit">Aktualizovat</button>
                    </div>

                </form>
            </div>
            {receipts.length > 0 ?
                <div>
                    <p className="mt-4 ml-12 text-lg">Celková útrata: {spend} Kč</p>
                    <DataTable columns={getColumns(setSelectedReceipt, handleDeleteReceipt)} data={receipts} />

                    <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
                        <DialogContent
                            className="fixed bg-[#09002f] text-black dark:text-white p-6 shadow-lg max-h-[85vh] overflow-y-auto md:max-w-[35vw]">
                            <DialogTitle className="text-xl">Detail účtenky</DialogTitle>
                            <ReceiptDetail
                                receipt={selectedReceipt}
                                categories={categories}
                                tags={tags}
                                handleDeletion={handleDeleteReceipt}
                            />
                        </DialogContent>
                    </Dialog>
                </div> :
                <div>
                    <p>Žádné výsledky.</p>
                </div>
            }
        </>
    )
}