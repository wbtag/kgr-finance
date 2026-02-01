'use server'
import { MongoClient } from "mongodb";
import { ObjectId } from "bson";
import { getWeek } from "date-fns";

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

export async function getSpend(timeframe, tags, categories) {

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
    } else if (timeframe.timestampFrom) {
        const from = new Date(timeframe.timestampFrom).getTime();
        const to = new Date().getTime();
        findObj = { date: { $gte: from, $lt: to } };
    } else {
        throw new Error('Period, cutoff point, or from/to must be specified in the timeframe.');
    };

    if (tags && tags.length > 0) {
        tags = JSON.parse(tags);
        tags = tags.map(({ value }) => value);
    } else {
        tags = [];
    }

    const output = await db.collection("receipts").find(findObj).toArray();

    const spend = output.reduce((acc, currentItem) => {
        if (categories.length === 0 || categories.includes(currentItem.category)) {
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
        }
        return acc
    }, 0)

    return spend;
};

// Deprecated
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
        const { amount, category, type } = curr;

        if (type != 'mandatory') {
            output.totalSpend += amount;

            if (!category || !categoryNames.includes(category) || category === 'Jiné') {
                output.other += amount;
            } else {
                acc[category].spend += amount;
            }
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

    if (day < fiscalMonthStart) {
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
        const { amount, category, type } = curr;

        if (type != 'mandatory') {
            output.totalSpend += amount;

            if (!category || !categoryNames.includes(category) || category === 'Jiné') {
                output.other += amount;
            } else {
                acc[category].spend += amount;
            }
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

export async function getReceipts(timeframe, tags, categories, offset, limit) {
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
        if (categories.length === 0 || categories.includes(currentItem.category)) {
            if (currentItem.type === 'extended') {
                const { _id, items, amount, date, ...receipt } = currentItem;
                let filteredItems = [];

                if (tags.length > 0) {
                    for (const item of items) {
                        const itemTags = currentItem.tags.concat(item.tags);
                        if (tags.every(tag => itemTags.includes(tag))) {
                            filteredItems.push(item);
                        }
                    }
                } else {
                    filteredItems = items;
                }

                const filteredAmount = filteredItems.reduce((acc, curr) => acc += curr.amount, 0);

                if (filteredItems.length > 0) {
                    acc.push({
                        id: _id.toHexString(),
                        date: new Date(date).toISOString().split('T')[0],
                        ...receipt,
                        items: filteredItems,
                        amount: filteredAmount
                    })
                }
            } else {
                const { _id, date, ...receipt } = currentItem;
                if (tags.length === 0 || tags.every(tag => currentItem.tags.includes(tag))) {
                    acc.push({
                        id: _id.toHexString(),
                        date: new Date(date).toISOString().split('T')[0],
                        ...receipt
                    });
                }
            }
        }

        return acc
    }, []);

    return output
}

export async function createNewReceipt(formData) {
    if (formData.receiptType && formData.date) {

        const currentDate = new Date();
        let receiptDate = new Date(formData.date);

        if (
            receiptDate.getDate() === currentDate.getDate() &&
            receiptDate.getMonth() === currentDate.getMonth() &&
            receiptDate.getFullYear() === currentDate.getFullYear()
        ) {
            receiptDate = currentDate;
        }

        const receiptDateTimestamp = receiptDate.getTime();

        const week = getWeek(receiptDate, { weekStartsOn: 0 });
        const year = receiptDate.getFullYear();
        const weekId = `${week}-${year}`;

        const dateCreated = Date.now();

        const { tags, amount, description, category } = formData;
        const tagJson = typeof tags === 'string' ? JSON.parse(tags) : tags;

        if (category && amount && description) {

            let cleanedTags = [];

            for (const tag of tagJson) {
                const cleanedTag = tag.value.trim().toLowerCase();
                cleanedTags.push(cleanedTag);
            };

            const typeSafeAmount = typeof amount === 'number' ? amount : parseInt(amount);

            const body = {
                type: formData.receiptType,
                category,
                date: receiptDateTimestamp,
                dateCreated,
                weekId,
                tags: cleanedTags,
                amount: typeSafeAmount,
                description
            };

            if (formData.receiptType === 'extended') {

                const { items } = formData;

                if (items.length > 0) {

                    body.items = [];

                    for (const item of items) {

                        if (typeof item.tags === 'object') {
                            return {
                                ok: false,
                                message: 'Ke každé položce v rozšířené útratě musí být uvedena alespoň jedna značka.'
                            }
                        }

                        if (item.amount === 0) {
                            return {
                                ok: false,
                                message: 'Ke každé položce v rozšířené útratě musí být uvedena částka.'
                            }
                        }

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

            return {
                ok: true
            }
        } else {
            return {
                ok: false,
                message: 'Kategorie, datum, částka a popis jsou povinné parametry.'
            }
        }
    } else {
        return {
            ok: false,
            message: 'Server neobdržel data v očekávaném formátu'
        }
    };
};

export async function updateReceipt(formData) {

    const { amount, description, category, type, date } = formData;
    const tags = formData.tags ? formData.tags : [];

    if (category && amount && description) {

        const typeSafeAmount = typeof amount === 'number' ? amount : parseInt(amount);

        const body = {
            date: new Date(date).getTime(),
            category,
            tags,
            amount: typeSafeAmount,
            description
        };

        if (type === 'extended') {

            const { items } = formData;
            let amountSum = 0;

            if (items.length > 0) {

                body.items = [];

                for (const item of items) {

                    if (Array.isArray(item.tags) && item.tags.length === 0) {
                        return {
                            ok: false,
                            message: 'Ke každé položce v rozšířené útratě musí být uvedena alespoň jedna značka.'
                        }
                    }

                    if (item.amount === 0) {
                        return {
                            ok: false,
                            message: 'Ke každé položce v rozšířené útratě musí být uvedena částka.'
                        }
                    }

                    let itemTags;

                    try {
                        const tagJson = JSON.parse(item.tags);
                        itemTags = tagJson.map(({ value }) => value);
                    } catch (e) {
                        itemTags = item.tags;
                    }

                    const typeSafeAmount = typeof item.amount === 'number' ? item.amount : parseInt(item.amount);
                    amountSum += typeSafeAmount;

                    body.items.push({
                        amount: typeSafeAmount,
                        tags: itemTags,
                    });
                };
            }

            if (typeSafeAmount != amountSum) {
                return {
                    ok: false,
                    message: 'Součet hodnot položek se musí rovnat celkové hodnotě účtenky.'
                }
            }
        }

        const db = await getDatabase();
        await db.collection("receipts").updateOne(
            { _id: new ObjectId(formData.id) },
            { $set: body }
        )

        return {
            ok: true
        }
    } else {
        return {
            ok: false,
            message: 'Kategorie, datum, částka a popis jsou povinné parametry.'
        }
    };
}

export async function deleteReceipt(id) {
    if (id) {
        try {
            const db = await getDatabase();
            await db.collection("receipts").deleteOne(
                { _id: new ObjectId(id) }
            )

            return {
                ok: true
            }
        } catch (e) {
            return {
                ok: false,
                message: `Při mazání účtenky došlo k chybě: ${e.message}`
            }
        }
    } else {
        return {
            ok: false,
            message: 'Při mazání účtenky došlo k chybě: Chybné ID účtenky'
        }
    }
}

export async function getBalance(balanceOnly) {
    const db = await getDatabase();

    const latestBalanceRecord = await db.collection("balances")
        .find({}, { sort: { createdAt: -1 }, limit: 1 })
        .toArray();

    if (latestBalanceRecord[0]) {
        const { createdAt, balance } = latestBalanceRecord[0];

        const spend = await getSpend({ timestampFrom: createdAt }, null, []);
        const income = await getIncome({ timestampFrom: createdAt });

        if (balanceOnly) {
            return balance + income - spend;
        } else {
            return {
                lastBalance: balance,
                lastBalanceDate: createdAt,
                estimatedBalance: balance + income - spend,
                spendSinceLastBalance: spend,
                incomeSinceLastBalance: income
            }
        }
    } else {
        if (balanceOnly) {
            return 0;
        } else {
            return {
                lastBalance: 0,
                lastBalanceDate: 0,
                estimatedBalance: 0,
                spendSinceLastBalance: 0,
                incomeSinceLastBalance: 0
            }
        }
    }
}

export async function logNewBalance(balance, expectedBalance) {

    balance = typeof balance === 'string' ? parseInt(balance) : balance;

    const body = {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        balance,
        offset: balance - expectedBalance
    };

    const db = await getDatabase();
    await db.collection("balances").insertOne(body);

    return {
        lastBalance: body.balance,
        lastBalanceDate: new Date(),
        estimatedBalance: body.balance,
        spendSinceLastBalance: 0
    }
}

export async function logIncome(formData) {
    const db = await getDatabase();

    let { amount, description, type } = formData;
    amount = typeof amount === 'string' ? parseInt(amount) : amount;

    await db.collection("income").insertOne({
        amount,
        description,
        type,
        createdAt: Date.now()
    })
}

export async function getIncome(timeframe) {
    const db = await getDatabase();

    let findObj = {};

    if (timeframe.period) {
        const timePeriod = timeframe.period;
        const cutoff = DateTime.now().minus(Duration.fromISO(timePeriod));
        const cutoffDate = new Date(cutoff.ts).setHours(0, 0, 0, 0);
        findObj = { createdAt: { $gte: cutoffDate } };
    } else if (timeframe.from && timeframe.to) {
        const from = Math.floor(new Date(timeframe.from).setHours(0));
        const to = Math.floor(new Date(timeframe.to).setHours(24));
        findObj = { createdAt: { $gte: from, $lt: to } };
    } else if (timeframe.timestampFrom) {
        const from = new Date(timeframe.timestampFrom).getTime();
        const to = new Date().getTime();
        findObj = { createdAt: { $gte: from, $lt: to } };
    } else {
        throw new Error('Period, cutoff point, or from/to must be specified in the timeframe.');
    };

    const output = await db.collection("income").find(findObj).toArray();

    const income = output.reduce((acc, currentItem) => acc + currentItem.amount, 0)

    return income;
}