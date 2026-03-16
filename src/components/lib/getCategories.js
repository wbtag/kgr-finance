'use server'

export async function getCategories() {
    let categories = process.env['MonthlySpendCategories'];
    categories = JSON.parse(categories);
    
    const categoryNames = Object.keys(categories);
    categoryNames.push('Jiné');
    return categoryNames
}