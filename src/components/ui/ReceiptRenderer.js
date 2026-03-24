import { useState } from "react";
import { getTags, updateReceipt, deleteReceipt } from "../lib/mongoLibrary";
import { ReceiptParams, ReceiptItems } from "./elements/receiptElements";
import { useStateHandler } from "../lib/useStateHandler";
import { useEffect } from "react";

export default function ReceiptRenderer({ receipts, categories }) {

    const [tags, setTags] = useState([]);

    const fetchTags = async () => {
        const tags = await getTags();
        setTags(tags);
    };

    useEffect(() => {
        fetchTags();
    }, []);

    return (
        <>
            {
                receipts.map((receipt, i) => (
                    <ReceiptRow key={receipt.id ?? i} receipt={receipt} categories={categories} tags={tags} />
                ))
            }
        </>
    )
}

function ReceiptRow({ receipt, categories, tags }) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const hasItems = Array.isArray(receipt.items) && receipt.items.length > 0;

    const handleDeleteReceipt = async (e) => {
        e.preventDefault()
        if (window.confirm("Opravdu smazat tuto účtenku?")) {
            const response = await deleteReceipt(receipt.id);
            if (response.ok) {
                window.alert("Účtenka smazána");
                window.location.reload();
            } else {
                window.alert(response.message);
            }
        }
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        setEditing(true);
    };

    return (
        <div
            onClick={() => setExpanded(e => !e)}
            className="border-b border-white/10"
        >
            <div className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 sm:gap-4 py-3 sm:py-3.5 cursor-pointer`}>

                <div className="min-w-0">
                    <p className="text-white/90 text-sm sm:text-base truncate tracking-wide">
                        {receipt.description}
                    </p>
                    <p className="text-xs italic mt-0.5 tracking-wide">
                        {receipt.category}
                    </p>
                </div>

                <span className="text-white/85 text-sm sm:text-base tabular-nums whitespace-nowrap">
                    {Number(receipt.amount).toLocaleString("cs-CZ")} Kč
                </span>

                <div
                    className={`text-white/25 transition-transform duration-200 flex items-center w-3 sm:w-3.5 ${expanded ? "rotate-180" : "rotate-0"}`}
                >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {expanded && (
                <div>
                    {editing ? (
                        <ReceiptEditForm
                            receipt={receipt}
                            tags={tags ?? []}
                            categories={categories}
                            onCancel={() => setEditing(false)}
                            onSaved={() => { setEditing(false); window.location.reload(); }}
                        />
                    ) : (
                        <>
                            <div>
                                <div className="flex flex-row">
                                    <p className="text-white/90 min-w-20 text-sm sm:text-base truncate tracking-wide">
                                        Datum:
                                    </p>
                                    <p className="text-white/90 text-sm sm:text-base truncate tracking-wide">
                                        {new Date(receipt.date).toLocaleDateString('cs-CZ')}
                                    </p>
                                </div>
                                <div className="flex flex-row">
                                    <p className="text-white/90 min-w-20 text-sm sm:text-base truncate tracking-wide">
                                        Značky:
                                    </p>
                                    <p className="text-white/90 text-sm sm:text-base truncate tracking-wide">
                                        {receipt.tags.join(", ")}
                                    </p>
                                </div>
                            </div>
                            {hasItems && (
                                <div>
                                    <p className="text-white/90 text-sm sm:text-base pb-2">Položky:</p>
                                    {
                                        receipt.items.map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex justify-between items-baseline gap-3 sm:gap-4 py-1 pl-3 sm:pl-4 pr-7 sm:pr-10"
                                            >
                                                <span className="text-white/75 text-xs sm:text-sm italic">
                                                    {Array.isArray(item.tags) && item.tags.length > 0 ? item.tags.join(", ") : "—"}
                                                </span>
                                                <span className="text-white/75 text-xs sm:text-sm tabular-nums whitespace-nowrap shrink-0">
                                                    {Number(item.amount).toLocaleString("cs-CZ")} Kč
                                                </span>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                            <div className="py-5 px-5 flex gap-1 justify-end">
                                <span>
                                    <button className="button button--active" onClick={handleEditClick}>Upravit</button>
                                </span>
                                <span>
                                    <button className="button button--active" onClick={handleDeleteReceipt}>Smazat</button>
                                </span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div >
    )
}

function ReceiptEditForm({ receipt, tags, categories, onCancel, onSaved }) {

    const {date, ...rest} = receipt;

    const stateHandler = useStateHandler({
        date: new Date(date).toISOString().split('T')[0],
        ...rest
    });

    const { formData } = stateHandler;

    const [saving, setSaving] = useState(false);

    const handleSave = async (e) => {

        e.stopPropagation();
        setSaving(true);

        try {
            const response = await updateReceipt(formData);

            if (response.ok) {
                onSaved();
            } else {
                window.alert(response.message);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="py-3 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
        >
            <ReceiptParams handler={stateHandler} categories={categories} tags={tags} />

            {receipt.type === 'extended' && (
                <ReceiptItems handler={stateHandler} tags={tags} />
            )}

            <div className="flex gap-2 justify-end pt-2">
                <button
                    type="button"
                    className="button button--active"
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                >
                    Zrušit
                </button>
                <button
                    type="button"
                    className="button button--active"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? "Ukládá se…" : "Uložit"}
                </button>
            </div>
        </div>
    );
}