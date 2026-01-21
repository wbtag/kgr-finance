export function Input({ label, handler, type, name, value }) {

    const {
        handleInput,
        formData
    } = handler;

    return (
        <>
            <div className="input flex flex-col w-fit static">
                <Label label={label} />
                <input
                    type={type ? type : "text"}
                    name={name}
                    value={value ?? formData[name]}
                    onChange={handleInput}
                    className="input px-[10px] py-[11px] border-1 rounded-[5px] w-[210px] focus:outline-none placeholder:text-black/25"
                />
            </div>
        </>
    )
}

export function Select({ label, handler, name, options }) {

    const {
        handleInput,
        formData
    } = handler;

    return (
        <>
            <div className="input flex flex-col w-fit static">
                <Label label={label} />
                <select
                    name={name}
                    value={formData[name]}
                    onChange={handleInput}
                    className="bg-transparent input px-[10px] py-[11px] border-1 border-white rounded-[5px] w-[210px] focus:outline-none placeholder:text-black/25"
                >
                    <option value=""></option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )
}

export function Label({ label }) {
    return (
        <>
            <div>
                <label
                    className="text-xs font-semibold relative top-2 ml-[7px] px-[3px] bg-[#09002f] w-fit"
                >{label}</label>
            </div>
        </>
    )
}