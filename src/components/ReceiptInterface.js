'use client'
import React, { useEffect, useRef, useState } from "react";
import Tagify from '@yaireo/tagify';
import { useRouter } from "next/navigation";
import { useStateHandler } from "./lib/useStateHandler";
import { createNewReceipt, getTags } from "./lib/mongoLibrary";
import { getCategories } from "./lib/getCategories";

export default function ReceiptInterface() {

    const router = useRouter();

    const [receiptType, setReceiptType] = useState('simple');
    const [tags, setTags] = useState([]);
    const [categories, setCategories] = useState([]);

    const handleReceiptTypeChange = (e) => {
        if (e.target.name === 'extended') {
            if (!stateHandler.formData.items) {
                stateHandler.changeFormData({
                    ...stateHandler.formData,
                    items: [{ amount: 0, tags: [''] }]
                });
            }
        };
        setReceiptType(e.target.name);
    };

    const initialState = {
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
        category: '',
        tags: [],
        items: [{ amount: 0, tags: [''] }]
    }

    const stateHandler = useStateHandler(initialState);

    const submitForm = async (e) => {
        e.preventDefault();

        const receiptBody = {
            ...stateHandler.formData,
            receiptType
        };

        try {
            await createNewReceipt(receiptBody);
            stateHandler.clearForm();
            window.alert('Účtenka úspěšně zaevidována');
        } catch (e) {
            window.alert(e.message);
        }
    };

    const fetchTags = async () => {
        const tags = await getTags();
        setTags(tags);
        tagify.current.whitelist = tags;
    };

    const fetchCategories = async () => {
        const categories = await getCategories();
        setCategories(categories);
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
        }
        );
        fetchTags();
        fetchCategories();
    }, [receiptType]);

    const goHome = () => {
        router.push('/');
    }

    const Switcher = ({ name, text }) => {
        return <button className={`button ${receiptType === name ? 'button-group-active' : ''}`} name={name} onClick={handleReceiptTypeChange}>{text}</button>
    }

    return (
        <>

            <button className="nav-button button" onClick={goHome}>&lt; Zpět na přehled</button>
            <div className="pad">
                <h1 className="pad-vertical text-2xl">Nová útrata</h1>
                <div className='inline-flex'>
                    <Switcher name='simple' text='Základní' />
                    <Switcher name='extended' text='Rozšířená' />
                </div>
                <div className="pad-vertical">
                    {receiptType === 'simple' ?
                        <div>
                            <SimpleReceipt stateHandler={stateHandler} categories={categories} />
                        </div> :
                        <div>
                            <ExtendedReceipt stateHandler={stateHandler} tags={tags} categories={categories} />
                        </div>
                    }
                </div>
                <button className="button" onClick={submitForm}>Odeslat</button>
            </div>
        </>
    )
}

function SimpleReceipt({ stateHandler, categories }) {

    const {
        handleInput,
        formData
    } = stateHandler;

    return (
        <>
            <div>
                <form>
                    <div className="flex flex-row">
                        <label className="w-20">Datum</label>
                        <input type="date" value={formData.date} name="date" onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Částka</label>
                        <input className="w-20" type="number" name="amount" value={formData.amount} onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Kategorie</label>
                        <select className="py-0" name="category" value={formData.category} onChange={handleInput}>
                            <option value=""></option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Popis</label>
                        <input className="w-30" type="text" name="description" value={formData.description} onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Značky</label>
                        <input name="tags" value={formData.tags} onChange={handleInput}></input>
                    </div>
                </form>
            </div>
        </>
    )
}

function ExtendedReceipt({ stateHandler, tags, categories }) {

    const {
        handleInput,
        formData,
    } = stateHandler;

    const receiptTotal = formData.items.reduce((acc, { amount }) => acc + (Number(amount) || 0), 0);

    return (
        <>
            <div>
                <form>
                    <div className="flex flex-row">
                        <label className="w-20">Datum</label>
                        <input type="date" value={formData.date} name="date" onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Částka</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Kategorie</label>
                        <select className="py-0" name="category" value={formData.category} onChange={handleInput}>
                            <option value=""></option>
                            {categories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Popis</label>
                        <input type="text" name="description" value={formData.description} onChange={handleInput}></input>
                    </div>
                    <div className="flex flex-row">
                        <label className="w-20">Značky</label>
                        <input name="tags" value={formData.tags} onChange={handleInput}></input>
                    </div>
                    <p className="pad-top">Zbývá do celkové částky: {formData.amount - receiptTotal}</p>
                    <h2 className="py-3 text-lg">Položky</h2>
                    <ReceiptItems stateHandler={stateHandler} tags={tags} />
                </form>
            </div>
        </>
    )
}

function ReceiptItems({ stateHandler, tags }) {

    const {
        addArrayItem,
        formData
    } = stateHandler;

    return (
        <>
            <div>
                {formData.items.map((item, index) => (
                    <div key={index} className="flex flex-row">
                        <ReceiptItem stateHandler={stateHandler} index={index} tags={tags} />
                    </div>
                ))}
            </div>
            <div>
                {formData.items.length <= 10 ?
                    <div>
                        <button className="button" name="items" onClick={(e) => addArrayItem(e)}>Přidat další položku</button>
                    </div> :
                    <div />
                }
            </div>
        </>
    )
}

function ReceiptItem({ stateHandler, index, tags }) {

    const tagify = useRef(null);

    useEffect(() => {
        const inputElem = window.document.querySelector(`input[name=tags-${index}]`);
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
    }, []);

    const {
        formData,
        changeArrayItem,
        removeArrayItem
    } = stateHandler;

    return (
        <>
            <div className="inline-flex pad-bottom">
                <div className="flex flex-row pr-2">
                    <label className="w-15">Částka</label>
                    <input className="w-15 h-6" name={`amount-${index}`} type="number" value={formData.items[index].amount} onChange={(e) => changeArrayItem(e, index)} />
                </div>
                <div className="flex flex-row pr-2">
                    <label className="w-15">Značky</label>
                    <input className="max-w-300" name={`tags-${index}`} type="text" value={formData.items[index].tags} onChange={(e) => changeArrayItem(e, index)} />
                </div>
                {
                    index != 0 ?
                        <button type="button" name="items" className="h-8 pl-2 button" onClick={(e) => removeArrayItem(e, index)}>-</button> :
                        <div />
                }
            </div>
        </>
    )
}