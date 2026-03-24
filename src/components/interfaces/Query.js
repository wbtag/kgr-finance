'use client'

import { useEffect, useState } from "react";
import { useStateHandler } from "../lib/useStateHandler";
import { getReceipts, getTags } from "../lib/mongoLibrary";
import { getCategories } from "../lib/getCategories";
import { Select, Input } from "../ui/elements/formElements";
import { TagInput } from "../ui/elements/receiptElements";
import ReceiptRenderer from "../ui/ReceiptRenderer";
import CategoryPicker from "../ui/CategoryPicker";

export default function Query() {

    const date = new Date();

    const fiscalMonthStart = parseInt(process.env['NEXT_PUBLIC_FiscalMonthStart']);

    const initialState = {
        timeframe: 'fiscalMonth',
        from: new Date(
            date.getFullYear(),
            date.getDate() >= fiscalMonthStart ?
                date.getMonth() : date.getMonth() - 1,
            fiscalMonthStart + 1
        ).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        queryTags: [],
        categories: []
    };

    const stateHandler = useStateHandler(initialState);
    const { formData, changeFormData } = stateHandler;

    const changeTimeframe = (e) => {

        const timeframe = e.target.value;

        let from, to;

        if (timeframe != 'custom') {

            const date = new Date();
            from = new Date();

            switch (timeframe) {
                case "week":
                    from.setDate(date.getDate() - date.getDay());
                    break;
                case "weekToDate":
                    from.setDate(date.getDate() - 6);
                    break;
                case "fiscalMonth":
                    if (date.getDate() >= fiscalMonthStart) {
                        from.setDate(fiscalMonthStart + 1);
                    } else {
                        from.setMonth(date.getMonth() - 1)
                        from.setDate(fiscalMonthStart) + 1;
                    }
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
            timeframe,
            queryTags: formData.queryTags,
            categories: formData.categories
        });
    };

    const [receipts, setReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategories, setActiveCategories] = useState([]);
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

    useEffect(() => {
        filterReceipts(receipts, activeCategories);
    }, [activeCategories]);

    const query = async (input) => {

        let from = formData.from;
        let to = formData.to;

        if (input && input.preventDefault) {
            input.preventDefault();
        } else if (input && input.from && input.to) {
            from = input.from;
            to = input.to;
        };
        
        const receipts = await getReceipts({ from, to }, formData.queryTags, formData.categories, 0, 200);
        setReceipts(receipts);
        setFilteredReceipts(receipts, formData.categories);
    };

    const filterReceipts = (receipts, categories) => {
        const receiptsToShow = receipts.filter((receipt) => categories.includes(receipt.category));
        setFilteredReceipts(receiptsToShow);
    };

    const timeframeOptions = [
        { name: "Tento týden", value: "week" },
        { name: "Posledních 7 dní", value: "weekToDate" },
        { name: "Tento měsíc", value: "month" },
        { name: "Fiskální měsíc", value: "fiscalMonth" },
        { name: "Posledních 30 dní", value: "monthToDate" },
        { name: "Vlastní", value: "custom" },
    ];

    return (
        <>
            <div className="md:mt-4">
                <form className="form" onSubmit={query}>
                    <div>
                        <div className="flex flex-col w-full max-w-120 mx-auto px-4 sm:px-0 py-2">
                            <Select
                                options={timeframeOptions}
                                handler={stateHandler}
                                changeHandler={changeTimeframe}
                                name="timeframe"
                                label="Časový úsek"
                            />
                            {formData.timeframe === 'custom' ?
                                <div className="flex flex-wrap gap-x-2">
                                    <Input
                                        label="Datum od"
                                        type="date"
                                        name="from"
                                        value={formData.from}
                                        handler={stateHandler}
                                    />
                                    <Input
                                        label="Datum do"
                                        type="date"
                                        name="to"
                                        value={formData.to}
                                        handler={stateHandler}
                                    />
                                </div> : <div />
                            }
                            <div className="flex flex-row">
                                <TagInput handler={stateHandler} tags={tags} name="queryTags" />
                            </div>
                            <div className="w-full flex justify-center md:justify-start mt-4">
                                <button className="button button--ux" type="submit">Aktualizovat</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <CategoryPicker
                categories={categories}
                activeCategories={activeCategories}
                setActiveCategories={setActiveCategories}
            />
            <p className="mt-4 text-lg text-center">Celková útrata: {filteredReceipts.reduce((a, c) => a + c.amount, 0)} Kč</p>
            {filteredReceipts.length > 0 ?
                <div>
                    <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 py-2">
                        <ReceiptRenderer receipts={filteredReceipts} categories={categories}  />
                    </div>
                </div> :
                <div>
                    <p className="py-5 text-center">Žádné výsledky.</p>
                </div>
            }
        </>
    )
}