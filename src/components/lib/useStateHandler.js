import { useState } from "react";

export const useStateHandler = (initialState) => {

    const [formData, setFormData] = useState(initialState);

    // Absolutely generic methods

    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value
        }));
    };

    const clearForm = () => {
        setFormData(initialState);
    };

    const changeFormData = (formData) => {
        setFormData(formData);
    };

    const addArrayItem = (e) => {
        e.preventDefault();
        const { name } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: [...prevState[name], {amount: 0, tags: ['']}],
        }));
    };

    const removeArrayItem = (e, index) => {
        e.preventDefault();
        const { name } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: prev[name].filter((_, i) => i !== index),
        }));
    };

    const changeArrayItem = (e, index) => {
        e.preventDefault();
        const { name, value } = e.target;
        const itemName = name.split('-')[0];
        const items = formData.items;
        items[index][itemName] = value;
        setFormData((prev) => ({
            ...prev,
            items,
        }));
    };

    return {
        clearForm,
        formData,
        handleInput,
        changeFormData,
        addArrayItem,
        removeArrayItem,
        changeArrayItem,
        // handleCheckboxChange,
        // handleSelectChange,
    }
}