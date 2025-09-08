'use server'
import { MongoClient } from "mongodb";

const url = process.env['MongoDbUrl'];
let client;

async function getDatabase() {
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
        findObj = { $match: { date: { $gte: cutoffDate } } };
    } else if (timeframe.from && timeframe.to) {
        const from = Math.floor(new Date(timeframe.from).setHours(0));
        const to = Math.floor(new Date(timeframe.to).setHours(24));
        findObj = { $match: { date: { $gte: from, $lt: to } } };
    } else {
        throw new Error('Period or from/to must be specified in the timeframe.');
    };

    if (tags && tags.length > 0) {
        tags = JSON.parse(tags);
        tags = tags.map(({ value }) => value);
        findObj['$match']['tags'] = { $all: tags };
    };

    const output = await db.collection("receipts").aggregate([
        findObj,
        {
            $group: {
                _id: null,
                spend: { $sum: "$amount" },
            }
        },
        {
            $project: {
                spend: 1,
                _id: 0
            }
        }
    ]).toArray();

    return output[0]?.spend ?? 0;
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

export async function getTags() {
    const db = await getDatabase();

    const output = await db.collection("receipts").aggregate([
        { $unwind: "$tags" },
        { $group: { _id: null, uniqueTags: { $addToSet: "$tags" } } },
        { $project: { _id: 0, uniqueTags: 1 } }
    ]).toArray();

    return output[0].uniqueTags;
};

export async function getRecentReceipts() {

    const db = await getDatabase();
    const receipts = await db.collection("receipts").aggregate([
        {
            $group: {
                _id: {
                    date: "$date",
                    description: "$description",
                    receiptId: "$receiptId"
                },
                amount: { $sum: "$amount" }
            }
        },
        {
            $project: {
                date: "$_id.date",
                description: "$_id.description",
                receiptId: "$_id.receiptId",
                amount: 1,
                _id: 0
            }
        },
        { $sort: { date: -1 } },
        { $skip: 0 },
        { $limit: 5 }
    ]).toArray();

    return receipts
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
        findObj['allTags'] = { $all: tags };
    };

    const receipts = await db.collection("receipts").aggregate([
        {
            $addFields: {
                allTags: {
                    $setUnion: [
                        { $ifNull: ["$tags", []] },
                        { $ifNull: ["$itemTags", []] },
                    ],
                },
            },
        },
        {
            $match: findObj
        },
        {
            $unset: ['allTags']
        }
    ]).toArray();

    let output = [];

    for (const receipt of receipts) {
        const { _id, ...rest } = receipt;
        const id = _id.toHexString();
        output.push({ id, ...rest });
    }

    return output
}

export async function createNewReceipt(formData) {
    if (formData.receiptType && formData.date) {
        const receiptDateTimestamp = new Date(formData.date).setHours(12, 0, 0, 0);
        const dateCreated = Date.now();

        const { tags, amount, description } = formData;
        const tagJson = JSON.parse(tags);

        if (tagJson.length > 0 && amount && description) {

            const receiptId = crypto.randomUUID();

            let cleanedTags = [];

            for (const tag of tagJson) {
                const cleanedTag = tag.value.trim();
                cleanedTags.push(cleanedTag);
            };

            const typeSafeAmount = typeof amount === 'number' ? amount : parseInt(amount);

            const body = {
                receiptId,
                type: formData.receiptType,
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
            throw new Error('Receipt date, amount, and description are mandatory parameters. Additionally, at least one tag must be selected.');
        }
    } else {
        throw new Error('Missing form data');
    };
}