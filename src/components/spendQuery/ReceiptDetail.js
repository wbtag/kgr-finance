import { useState } from "react";
import { useStateHandler } from "../lib/useStateHandler";
import { ReceiptParams, ReceiptItems } from "../ui/receiptElements";
import { updateReceipt } from "../lib/mongoLibrary";

export default function ReceiptDetail({ receipt, categories, tags, handleDeletion }) {

    const [editState, setEditState] = useState(false);

    const toggleEdit = () => {
        setEditState(!editState);
    };

    const initialState = {
        date: receipt?.date,
        amount: receipt?.amount,
        description: receipt?.description,
        category: receipt?.category,
        type: receipt?.type,
        tags: receipt?.tags,
        items: receipt?.type === "extended" ? receipt?.items : null
    };

    const stateHandler = useStateHandler(initialState);
    const { formData, changeFormData } = stateHandler;

    const handleReceiptUpdate = async (e) => {
        e.preventDefault();

        try {
            const response = await updateReceipt({ id: receipt.id, ...stateHandler.formData });
            if (!response.ok) {
                window.alert(`Chyba: ${response.message}`);
            }
            setEditState(!editState);
            window.location.reload()
        } catch (e) {
            window.alert(e.message);
        }
    };

    const handleCancelReceiptUpdate = (e) => {
        e.preventDefault();
        changeFormData(initialState);
        setEditState(!editState);
    };

    return (
        <>
            <div>
                {
                    editState ?
                        <div>
                            <ReceiptParams handler={stateHandler} categories={categories} tags={tags} />
                            {
                                formData?.type === "extended" ?
                                    <div className="mb-2">
                                        <ReceiptItems handler={stateHandler} tags={tags} />
                                    </div>
                                    : <div />
                            }
                            <div className="flex flex-row justify-center gap-1 mt-3">
                                <button className="button" onClick={handleReceiptUpdate}>Uložit</button>
                                <button className="button" onClick={handleCancelReceiptUpdate}>Zrušit</button>
                            </div>
                        </div>
                        : <div>
                            <StaticReceipt formData={formData} />
                            <div className="flex flex-row justify-center gap-1 mt-3">
                                <button className="button" onClick={toggleEdit}>Upravit</button>
                                <button className="button" onClick={() => handleDeletion(receipt)}>Smazat účtenku</button>
                            </div>
                        </div>
                }
            </div>
        </>
    )
}

function StaticReceipt({ formData }) {

    const parseTags = (tags) => {
        if (typeof tags === "string") {
            tags = JSON.parse(tags);
            return tags.reduce((acc, curr) => {
                acc += (acc != "" ? ", " : "") + curr.value;
                return acc
            }, "");
        } else {
            return tags.join(", ")
        }
    };

    return (
        <>
            <div className="mb-2">
                <p>Datum: {formData?.date}</p> 
                <p>Kategorie: {formData?.category}</p>
                <p>Popis: {formData?.description}</p>
                <p>Částka: {formData?.amount} Kč</p>
                <p>Značky: {parseTags(formData.tags)}</p>
            </div>
            {
                formData?.type === 'extended' ?
                    <div className="mb-2">
                        <p className="text-lg my-2">Položky</p>
                        {formData?.items.map((item, index) => (
                            <div key={index} className="flex flex-row">
                                <p>{parseTags(item.tags)}:&nbsp;</p>
                                <p>{item.amount} Kč</p>
                            </div>
                        ))}
                    </div>
                    : <div />
            }
        </>
    )
}