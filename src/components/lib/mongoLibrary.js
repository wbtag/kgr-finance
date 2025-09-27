'use server'
import { MongoClient } from "mongodb";

const url = process.env['MongoDbUrl'];
let client;

export async function getDatabase() {
    if (!client) {
        client = new MongoClient(url);
        await client.connect();
    }
    const db = client.db("finances");
    return db
}

export async function getSpend(timeframe, tags) {

    const db = await getDatabase();

    let findObj = {};

    if (timeframe.period) {
        const timePeriod = timeframe.period;
        const cutoff = DateTime.now().minus(Duration.fromISO(timePeriod));
        const cutoffDate = new Date(cutoff.ts).setHours(0, 0, 0, 0);
        findObj = { date: { $gte: cutoffDate } };
    } else if (timeframe.from && timeframe.to) {
        const from = Math.floor(new Date(timeframe.from).setHours(0));
        const to = Math.floor(new Date(timeframe.to).setHours(24));
        findObj = { date: { $gte: from, $lt: to } };
    } else {
        throw new Error('Period or from/to must be specified in the timeframe.');
    };

    if (tags && tags.length > 0) {
        tags = JSON.parse(tags);
        tags = tags.map(({ value }) => value);
    } else {
        tags = [];
    }

    const output = await db.collection("receipts").find(findObj).toArray();

    const spend = output.reduce((acc, currentItem) => {
        if (currentItem.type === 'extended') {
            const { items } = currentItem;
            const filteredItems = [];

            for (const item of items) {
                const itemTags = currentItem.tags.concat(item.tags);
                if (tags.every(tag => itemTags.includes(tag))) {
                    filteredItems.push(item);
                }
            }

            acc += filteredItems.reduce((acc, curr) => acc += curr.amount, 0);
        } else {
            if (tags.every(tag => currentItem.tags.includes(tag))) {
                acc += currentItem.amount;
            }
        }

        return acc
    }, 0)

    return spend;
};

export async function getWeeklySpend() {

    const nowDate = new Date();
    const dayOfWeek = nowDate.getDay();

    const startOfWeekDate = new Date();
    startOfWeekDate.setDate(nowDate.getDate() - dayOfWeek);
    const ts = startOfWeekDate.setHours(0, 0, 0, 0);

    let excludedTags = process.env['ExcludedTags'] || '';
    excludedTags = excludedTags.split(',');

    const db = await getDatabase();
    const output = await db.collection("receipts").aggregate([
        {
            $facet: {
                withExcluded: [{ $match: { date: { $gte: ts }, tags: { $nin: excludedTags } } },
                {
                    $group: {
                        _id: null,
                        weeklySpend: { $sum: "$amount" }
                    }
                }],
                withoutExcluded: [
                    { $match: { date: { $gte: ts } } },
                    {
                        $group: {
                            _id: null,
                            weeklySpend: { $sum: "$amount" }
                        }
                    }
                ]
            }
        }
    ]).toArray();

    const cleanWeeklySpend = output[0]?.withExcluded?.[0]?.weeklySpend || 0;
    const fullWeeklySpend = output[0]?.withoutExcluded?.[0]?.weeklySpend || 0;

    return {
        cleanWeeklySpend,
        fullWeeklySpend
    }
};

export async function getWeeklySpendByCategory() {
    const nowDate = new Date();
    const dayOfWeek = nowDate.getDay();

    const startOfWeekDate = new Date();
    startOfWeekDate.setDate(nowDate.getDate() - dayOfWeek);
    const ts = startOfWeekDate.setHours(0, 0, 0, 0);

    const findObj = { date: { $gte: ts } };

    let categories = process.env['WeeklySpendCategories'] || '';
    categories = JSON.parse(categories);

    const categoryNames = Object.keys(categories);

    const spendObject = categoryNames.reduce((acc, curr) => {
        acc[curr] = {
            spend: 0,
            limit: categories[curr]
        }
        return acc
    }, {});

    const db = await getDatabase();

    const receipts = await db.collection("receipts").find(findObj).toArray();

    const output = {
        totalSpend: 0,
        other: 0
    }

    output.categories = receipts.reduce((acc, curr) => {
        const { amount, category } = curr;

        output.totalSpend += amount;

        if (!category || category === 'Jiné') {
            output.other += amount;
        } else {
            acc[category].spend += amount;
        }

        return acc
    }, spendObject);

    return output
}

export async function getMonthlySpendByCategory() {
    const nowDate = new Date();
    const day = nowDate.getDate();

    const fiscalMonthStart = parseInt(process.env['FiscalMonthStart']) || 15;

    let from = new Date();
    from.setDate(fiscalMonthStart);

    if (day < fiscalMonthStart - 1) {
        from.setMonth(from.getMonth() - 1);
    }

    const ts = from.setHours(0, 0, 0, 0);
    const findObj = { date: { $gte: ts } };

    let categories = process.env['MonthlySpendCategories'] || '';
    categories = JSON.parse(categories);

    const categoryNames = Object.keys(categories);

    const spendObject = categoryNames.reduce((acc, curr) => {
        acc[curr] = {
            spend: 0,
            limit: categories[curr]
        }
        return acc
    }, {});

    const db = await getDatabase();

    const receipts = await db.collection("receipts").find(findObj).toArray();

    const output = {
        totalSpend: 0,
        other: 0
    }

    output.categories = receipts.reduce((acc, curr) => {
        const { amount, category } = curr;

        output.totalSpend += amount;

        if (!category || category === 'Jiné') {
            output.other += amount;
        } else {
            acc[category].spend += amount;
        }

        return acc
    }, spendObject);

    return output
}

export async function getTags() {
    const db = await getDatabase();

    const output = await db.collection("receipts").aggregate([
        { $unwind: "$tags" },
        { $group: { _id: null, uniqueTags: { $addToSet: "$tags" } } },
        { $project: { _id: 0, uniqueTags: 1 } }
    ]).toArray();

    return output[0].uniqueTags;
};

export async function getReceipts(timeframe, tags, offset, limit) {
    const db = await getDatabase();

    let findObj = {};

    if (timeframe.period) {
        const timePeriod = timeframe.period;
        const cutoff = DateTime.now().minus(Duration.fromISO(timePeriod));
        const cutoffDate = new Date(cutoff.ts).setHours(0, 0, 0, 0);
        findObj = { date: { $gte: cutoffDate } };
    } else if (timeframe.from && timeframe.to) {
        const from = Math.floor(new Date(timeframe.from).setHours(0));
        const to = Math.floor(new Date(timeframe.to).setHours(24));
        findObj = { date: { $gte: from, $lt: to } };
    } else {
        throw new Error('Period or from/to must be specified in the timeframe.');
    };

    if (tags && tags.length > 0) {
        tags = JSON.parse(tags);
        tags = tags.map(({ value }) => value);
    } else {
        tags = [];
    }

    const receipts = await db.collection("receipts").find(findObj).sort({ date: -1 }).toArray()

    const output = receipts.reduce((acc, currentItem) => {
        if (currentItem.type === 'extended') {
            const { _id, items, amount, ...receipt } = currentItem;
            const filteredItems = [];

            for (const item of items) {
                const itemTags = currentItem.tags.concat(item.tags);
                if (tags.every(tag => itemTags.includes(tag))) {
                    filteredItems.push(item);
                }
            }

            const filteredAmount = filteredItems.reduce((acc, curr) => acc += curr.amount, 0);

            if (filteredItems.length > 0) {
                acc.push({
                    id: _id.toHexString(),
                    ...receipt,
                    items: filteredItems,
                    amount: filteredAmount
                })
            }
        } else {
            const { _id, ...receipt } = currentItem;
            if (tags.every(tag => currentItem.tags.includes(tag))) {
                acc.push({
                    id: _id.toHexString(),
                    ...receipt
                });
            }
        }

        return acc
    }, []);

    return output
}

export async function createNewReceipt(formData) {
    if (formData.receiptType && formData.date) {
        const receiptDateTimestamp = new Date(formData.date).setHours(12, 0, 0, 0);
        const dateCreated = Date.now();

        const { tags, amount, description, category } = formData;
        const tagJson = JSON.parse(tags);

        if (category && tagJson.length > 0 && amount && description) {

            let cleanedTags = [];

            for (const tag of tagJson) {
                const cleanedTag = tag.value.trim();
                cleanedTags.push(cleanedTag);
            };

            const typeSafeAmount = typeof amount === 'number' ? amount : parseInt(amount);

            const body = {
                type: formData.receiptType,
                category,
                date: receiptDateTimestamp,
                dateCreated,
                tags: cleanedTags,
                amount: typeSafeAmount,
                description
            };

            if (formData.receiptType === 'extended') {

                const { items } = formData;

                if (items.length > 0) {

                    body.items = [];

                    for (const item of items) {

                        const tagJson = JSON.parse(item.tags);
                        const itemTags = tagJson.map(({ value }) => value);

                        const typeSafeAmount = typeof item.amount === 'number' ? item.amount : parseInt(item.amount);

                        body.items.push({
                            amount: typeSafeAmount,
                            tags: itemTags,
                        })
                    };
                }
            }

            const db = await getDatabase();
            await db.collection("receipts").insertOne(body);

        } else {
            throw new Error('Receipt category, date, amount, and description are mandatory parameters. Additionally, at least one tag must be selected.');
        }
    } else {
        throw new Error('Missing form data');
    };
}