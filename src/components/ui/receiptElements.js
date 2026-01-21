import { Input, Select, Label } from "./formElements";
import Tagify from "@yaireo/tagify";
import { useRef, useEffect } from "react";

export function ReceiptItems({ handler, tags }) {

    const { formData, changeArrayItem } = handler;

    return (
        <>
            <h2 className="mt-3 text-xl">Položky</h2>
            {formData?.items.map((i, index) => (
                <div key={index} className="flex flex-row gap-2">
                    <div className="input flex flex-col w-fit static">
                        <Label label="Částka" />
                        <input
                            type="number"
                            name={`amount-${index}`}
                            value={formData.items[index].amount}
                            onChange={(e) => changeArrayItem(e, index)}
                            className="input px-[10px] py-[11px] border-1 rounded-[5px] w-[210px] focus:outline-none placeholder:text-black/25"
                        />
                    </div>
                    <div>
                        <TagInput handler={handler} tags={tags} index={index} />
                    </div>
                </div>
            ))}
            <p>Zbývá do celkové částky: {formData.amount - formData.items.reduce((acc, curr) => acc + Number(curr.amount), 0)}</p>
        </>
    )
}

export function ReceiptParams({ handler, categories, tags }) {

    const { formData } = handler;

    return (
        <>
            <Select label="Kategorie" name="category" options={categories} handler={handler} />
            <Input label="Popis" name="description" value={formData.description} handler={handler} />
            <Input label="Částka" name="amount" value={formData.amount} handler={handler} />
            <TagInput handler={handler} tags={tags} />
        </>
    )
}

function TagInput({ handler, tags, index }) {

    const {
        handleInput,
        formData,
        changeArrayItem
    } = handler;

    const tagify = useRef(null);

    index = index || index === 0 ? index.toString() : null;
    const name = index ? `tags-${index}` : "parentTags";

    useEffect(() => {
        const inputElem = window.document.querySelector(`input[name=${name}]`);
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
    }, []);

    return (
        <>
            <div>
                <Label label="Značky" />
                <input
                    className="input px-[10px] py-[11px] border-1 rounded-[5px] w-[210px] focus:outline-none placeholder:text-black/25"
                    name={name}
                    value={index ? formData.items[index].tags : formData.parentTags}
                    onChange={index ? (e) => changeArrayItem(e, index) : handleInput}>
                </input>
            </div>
        </>
    )
}