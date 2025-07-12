'use server'
const { CosmosClient } = require('@azure/cosmos');
const cosmosConnectionString = process.env['CosmosConnectionString'];
const crypto = require('crypto');

const client = new CosmosClient(cosmosConnectionString);
const containerClient = client
    .database(process.env['CosmosDatabaseName'])
    .container(process.env['CosmosContainerName']);

export async function getSpend(timeframe, tags) {
    let query = 'SELECT * FROM c ';

    if (timeframe.period) {
        const timePeriod = timeframe.period;
        const cutoff = DateTime.now().minus(Duration.fromISO(timePeriod));
        const cutoffDate = Math.floor(new Date(cutoff.ts).setHours(0, 0, 0, 0));
        query += `WHERE c.date >= ${cutoffDate}`;
    } else if (timeframe.from && timeframe.to) {
        const from = Math.floor(new Date(timeframe.from).setHours(0));
        const to = Math.floor(new Date(timeframe.to).setHours(24));
        query += `WHERE c.date >= ${from} AND c.date < ${to}`;
    } else {
        throw new Error('Period or from/to must be specified in the timeframe.');
    }

    let { resources } = await containerClient.items.query(query).fetchAll();

    if (tags) {
        resources = resources.filter(res => res.tags.some(tag => tags.includes(tag)));
    };

    let spend = 0;
    for (const resource of resources) {
        spend += resource.amount;
    };
}

export async function getWeeklySpend() {

    const nowDate = new Date();
    const dayOfWeek = nowDate.getDay();

    const startOfWeekDate = new Date();
    startOfWeekDate.setDate(nowDate.getDate() - dayOfWeek);
    const startTimestamp = startOfWeekDate.setHours(0, 0, 0, 0);

    const query = `SELECT * FROM c WHERE c._ts > ${Math.floor(startTimestamp / 1000)}`;

    let { resources } = await containerClient.items.query(query).fetchAll();

    let spend = 0;
    for (const resource of resources) {
        spend += resource.amount;
    };

    return spend
}

export async function getTags() {
    const query = 'SELECT c.tags FROM c';

    let { resources } = await containerClient.items.query(query).fetchAll();
    let tags = [];

    for (const resource of resources) {
        tags = tags.concat(resource.tags);
    }

    tags = new Set(tags);

    return [...tags];
}

export async function getRecentReceipts() {
    const query = `SELECT c.date, c.description, c.receiptId, SUM(c.amount) as amount
    FROM c GROUP BY c.date, c.description, c.receiptId ORDER BY c.date DESC OFFSET 0 LIMIT 5`;

    const { resources } = await containerClient.items.query(query).fetchAll();
    let receipts = [];

    for (const resource of resources) {
        receipts.push({
            id: resource.id,
            description: resource.description,
            amount: resource.amount,
            date: resource.date
        });
    };

    return receipts
}

export async function createNewReceipt(formData) {
    if (formData.receiptType && formData.date) {
        const receiptDateTimestamp = new Date(formData.date).setHours(12, 0, 0, 0);
        if (formData.receiptType === 'simple') {

            const { tags, amount, description } = formData;
            const tagJson = JSON.parse(tags);

            if (tagJson.length > 0 && amount && description) {

                const receiptId = crypto.randomUUID();

                let cleanedTags = [];

                for (const tag of tagJson) {
                    cleanedTags.push(tag.value);
                };

                const typeSafeAmount = typeof amount === 'number' ? amount : parseInt(amount);

                await containerClient.items.create({
                    receiptId,
                    date: receiptDateTimestamp,
                    tags: cleanedTags,
                    amount: typeSafeAmount,
                    description
                });
            } else {
                throw new Error('Receipt date, amount, and description are mandatory parameters. Additionally, at least one tag must be selected.');
            }
        } else if (formData.receiptType === 'extended') {

            const { description, items, tags } = formData;

            if (description && items.length > 0) {

                const tagJson = JSON.parse(tags);
                const receiptTags = tagJson.map(({ value }) => value);
                const receiptId = crypto.randomUUID();

                for (const item of items) {

                    const tagJson = JSON.parse(item.tags);
                    const itemTags = tagJson.map(({ value }) => value);

                    const mergedTags = itemTags.concat(receiptTags);

                    const typeSafeAmount = typeof item.amount === 'number' ? item.amount : parseInt(item.amount);

                    const formData = {
                        receiptId,
                        date: receiptDateTimestamp,
                        tags: mergedTags,
                        amount: typeSafeAmount,
                        description
                    };

                    console.log(formData);

                    await containerClient.items.create(formData);
                };
            } else {
                throw new Error('Receipt date, amount, and description are mandatory parameters. Additionally, at least one tag must be selected.');
            }
        }
    } else {
        throw new Error('Missing form data');
    };
}