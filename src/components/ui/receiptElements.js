import { Input, Select, Label } from "./formElements";
import Tagify from "@yaireo/tagify";
import { useRef, useEffect } from "react";

export function ReceiptParams({ handler, categories, tags, type }) {

    const { formData } = handler;

    return (
        <>
            <Input label="Datum" type="date" name="date" value={formData.date} handler={handler} />
            {type != "mandatory" ?
                <div>
                    <Select label="Kategorie" name="category" blankOption={true} options={categories} value={formData.category} handler={handler} />
                </div> :
                <div />
            }
            <Input label="Popis" name="description" value={formData.description} handler={handler} />
            <Input label="Částka" name="amount" value={formData.amount} handler={handler} />
            <TagInput handler={handler} tags={tags} />
        </>
    )
}

export function ReceiptItems({ handler, tags }) {

    const { formData, changeArrayItem, addArrayItem, removeArrayItem } = handler;

    return (
        <>
            <div>
                <h2 className="mt-3 text-xl">Položky</h2>
                <div>
                    {formData.items.length <= 10 ?
                        <div>
                            <button className="button mt-2" name="items" onClick={(e) => addArrayItem(e)}>Přidat další položku</button>
                        </div> :
                        <div />
                    }
                </div>
                {formData?.items.map((i, index) => (
                    <div key={index} className="flex flex-row">
                        <div className="flex flex-wrap f gap-2">
                            <div className="input flex flex-col w-fit static">
                                <Label label="Částka" />
                                <input
                                    type="number"
                                    name={`amount-${index}`}
                                    value={formData.items[index].amount}
                                    onChange={(e) => changeArrayItem(e, index)}
                                    className="input px-[10px] py-[11px] border-1 rounded-[5px] w-[65px] md:w-[180px] focus:outline-none placeholder:text-black/25"
                                />
                            </div>
                            <div>
                                <TagInput handler={handler} tags={tags} index={index} />
                            </div>
                        </div>
                        {
                            index != 0 ?
                                <div className="py-[25px] px-2">
                                    <button type="button" name="items" className="h-8 pl-2 button" onClick={(e) => removeArrayItem(e, index)}>-</button>
                                </div> :
                                <div />
                        }
                    </div>
                ))}
                <p>Zbývá do celkové částky: {formData.amount - formData.items.reduce((acc, curr) => acc + Number(curr.amount), 0)}</p>
            </div>
        </>
    )
}

export function TagInput({ handler, tags, index, name }) {

    const {
        handleInput,
        formData,
        changeArrayItem
    } = handler;

    const tagify = useRef(null);

    index = index || index === 0 ? index.toString() : null;

    if (!name) {
        name = index ? `tags-${index}` : "tags";
    }

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
            <div className="flex flex-col">
                <Label label="Značky" />
                <input
                    className="input px-[10px] py-[11px] border-1 rounded-[5px] md:w-[210px] w-[180px] focus:outline-none placeholder:text-black/25"
                    name={name}
                    value={index ? formData.items[index].tags : formData[name]}
                    onChange={index ? (e) => changeArrayItem(e, index) : handleInput}>
                </input>
            </div>
        </>
    )
}