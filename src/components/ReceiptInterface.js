'use client'
import React, { useEffect, useRef, useState } from "react";
import Tagify from '@yaireo/tagify';
import { useStateHandler } from "./lib/useStateHandler";
import { createNewReceipt, getTags } from "./lib/mongoLibrary";
import { getCategories } from "./lib/getCategories";
import Switcher from "./Switcher";
import { ReceiptParams, ReceiptItems } from "./ui/receiptElements";

export default function ReceiptInterface() {

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
        } else if (e.target.name === 'mandatory') {
            stateHandler.changeFormData({
                ...stateHandler.formData,
                category: 'Mandatorní'
            });
        }
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
    const { formData } = stateHandler;

    const submitForm = async (e) => {
        e.preventDefault();

        if (
            receiptType != "extended" || 
            Number(formData.amount) - formData.items.reduce((acc, curr) => acc + Number(curr.amount), 0) === 0
        ) {
            const receiptBody = {
                ...formData,
                receiptType
            };

            try {
                const response = await createNewReceipt(receiptBody);
                if (response.ok) {
                    stateHandler.clearForm();
                    window.alert('Účtenka úspěšně zaevidována');
                } else {
                    window.alert(`Chyba: ${response.message}`);
                }
            } catch (e) {
                window.alert(e.message);
            }
        } else {
            window.alert("Chyba: Součet položek v rozšířené účtence se musí rovnat celkové hodnotě účtenky.")
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

    return (
        <>
            <div className="mt-4">
                <div className="ml-12 space-y-5">
                    <h1 className="text-2xl">Nová útrata</h1>
                    <div className='inline-flex gap-1'>
                        <Switcher name='simple' text='Základní' stateTracker={receiptType} changeHandler={handleReceiptTypeChange} />
                        <Switcher name='extended' text='Rozšířená' stateTracker={receiptType} changeHandler={handleReceiptTypeChange} />
                        <Switcher name='mandatory' text='Mandatorní' stateTracker={receiptType} changeHandler={handleReceiptTypeChange} />
                    </div>
                    <div className="">
                        <ReceiptParams handler={stateHandler} tags={tags} categories={categories} type={receiptType} />
                        {
                            receiptType === "extended" ?
                                <div className="mb-2">
                                    <ReceiptItems handler={stateHandler} tags={tags} />
                                </div>
                                : <div />
                        }
                    </div>
                    <div className="w-full flex mt-2 pr-12 justify-center md:justify-start">
                        <button className="button" onClick={submitForm}>Odeslat</button>
                    </div>
                </div>

            </div>
        </>
    )
}