'use client'
import React, { useEffect, useRef, useState } from "react";
import { request } from "./lib/request";
import Tagify from '@yaireo/tagify';
import { useRouter } from "next/navigation";
import { useStateHandler } from "./lib/useStateHandler";

export default function ReceiptInterface() {

    const router = useRouter();

    const [receiptType, setReceiptType] = useState('simple');

    const handleReceiptTypeChange = (e) => {
        if (e.target.name === 'extended') {
            if (!stateHandler.formData.items) {
                stateHandler.changeFormData({
                    ...stateHandler.formData,
                    items: [{ amount: 0, tags: [''] }]
                });
            }
        }
        setReceiptType(e.target.name);
    };

    const initialState = {
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
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

        const response = await request(`${process.env.NEXT_PUBLIC_FUNCTIONS_DOMAIN}/api/receipts/new`, 'POST', {}, receiptBody);
        if (!response.error) {
            stateHandler.clearForm();
            window.alert('Účtenka úspěšně zaevidována');
        } else {
            window.alert(response.error.message);
        }
    }

    const tagify = useRef(null);

    useEffect(() => {
        const inputElem = window.document.querySelector('input[name=tags]');
        tagify.current = new Tagify(inputElem, {
            whitelist: tags,
            dropdown: {
                classname: "select",
                enabled: 0,
                maxItems: 5,
                position: "text",
                closeOnSelect: false,
                highlightFirst: true
            }
        }
        );
        getTags();
    }, [receiptType]);

    const [tags, setTags] = useState([]);
    const getTags = async () => {
        const response = await request(`${process.env.NEXT_PUBLIC_FUNCTIONS_DOMAIN}/api/tags`, 'GET', {}, null);
        tagify.current.whitelist = response;
        setTags(response);
    }

    const goHome = () => {
        router.push('/');
    }

    const Switcher = ({ name, text }) => {
        return <button className={`button ${receiptType === name ? 'button-group-active' : 'button-group'} min-margin`} name={name} onClick={handleReceiptTypeChange}>{text}</button>
    }

    return (
        <>
            <div className="pad">
                <button onClick={goHome}>Zpět na přehled</button>
                <h1 className="pad-vertical">Nový účet</h1>
                <div className='flex-row'>
                    <Switcher name='simple' text='Základní' />
                    <Switcher name='extended' text='Rozšířený' />
                </div>
                <div className="pad-vertical">
                    {receiptType === 'simple' ?
                        <div>
                            <SimpleReceipt stateHandler={stateHandler} />
                        </div> :
                        <div>
                            <ExtendedReceipt stateHandler={stateHandler} tags={tags} />
                        </div>
                    }
                </div>
                <button className="button" onClick={submitForm}>Odeslat</button>
            </div>
        </>
    )
}

function SimpleReceipt({ stateHandler }) {

    const {
        handleInput,
        formData
    } = stateHandler;

    return (
        <>
            <div>
                <form>
                    <div className="form">
                        <label className="form-label">Datum</label>
                        <input type="date" value={formData.date} name="date" onChange={handleInput}></input>
                    </div>
                    <div className="form">
                        <label className="form-label">Částka</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleInput}></input>
                    </div>
                    <div className="form">
                        <label className="form-label">Popis</label>
                        <input type="text" name="description" value={formData.description} onChange={handleInput}></input>
                    </div>
                    <div className="form">
                        <label className="form-label">Značky</label>
                        <input name="tags" value={formData.tags} onChange={handleInput}></input>
                    </div>
                </form>
            </div>
        </>
    )
}

function ExtendedReceipt({ stateHandler, tags }) {

    const {
        handleInput,
        formData,
    } = stateHandler;

    const receiptTotal = formData.items.reduce((acc, { amount }) => acc + (Number(amount) || 0), 0);

    return (
        <>
            <div>
                <form>
                    <div className="form">
                        <label className="form-label">Datum</label>
                        <input type="date" value={formData.date} name="date" onChange={handleInput}></input>
                    </div>
                    <div className="form">
                        <label className="form-label">Částka</label>
                        <input type="number" name="amount" value={formData.amount} onChange={handleInput}></input>
                    </div>
                    <div className="form">
                        <label className="form-label">Popis</label>
                        <input type="text" name="description" value={formData.description} onChange={handleInput}></input>
                    </div>
                    <div className="form">
                        <label className="form-label">Značky</label>
                        <input name="tags" value={formData.tags} onChange={handleInput}></input>
                    </div>
                    <p className="pad-top">Zbývá do celkové částky: {formData.amount - receiptTotal}</p>
                    <h2 className="pad-vertical">Položky</h2>
                    <ReceiptItems stateHandler={stateHandler} tags={tags} />
                </form>
            </div>
        </>
    )
}

function ReceiptItems({ stateHandler, tags }) {

    const {
        addArrayItem,
        removeArrayItem,
        formData
    } = stateHandler;

    return (
        <>
            <div>
                {formData.items.map((item, index) => (
                    <div key={index} className="flex-row">
                        <ReceiptItem stateHandler={stateHandler} index={index} tags={tags} />
                        {
                            index != 0 ?
                                <button type="button" name="items" className="button" onClick={(e) => removeArrayItem(e, index)}>-</button> :
                                <div />
                        }
                    </div>
                ))}
            </div>
            <div className="pad-vertical">
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

    useEffect(() => {
        tagify.current.whitelist = tags
    }, [[tags]])

    const {
        formData,
        changeArrayItem
    } = stateHandler;

    return (
        <>
            <div className="flex-row wrap pad-bottom">
                <div>
                    <label className="form-label">Částka</label>
                    <input name={`amount-${index}`} type="number" value={formData.items[index].amount} onChange={(e) => changeArrayItem(e, index)} />
                </div>
                <div>
                    <label className="form-label">Značky</label>
                    <input name={`tags-${index}`} type="text" value={formData.items[index].tags} onChange={(e) => changeArrayItem(e, index)} />
                </div>
            </div>
        </>
    )
}