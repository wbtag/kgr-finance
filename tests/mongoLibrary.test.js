import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as mongoLibrary from "../src/components/lib/mongoLibrary";

let mongod;
let client;
let db;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MongoDbUrl = mongod.getUri();
    client = new MongoClient(mongod.getUri());
    await client.connect();
    db = client.db("finances");
});

afterAll(async () => {
    await client.close();
    await mongod.stop();
});

beforeEach(async () => {
    await db.collection("receipts").deleteMany({});
});

describe("createNewReceipt", () => {

    it("creates a simple receipt", async () => {
        const result = await mongoLibrary.createNewReceipt({
            receiptType: 'simple',
            date: new Date().toISOString().split('T')[0],
            category: 'Test',
            amount: 100,
            description: 'Test',
            tags: '[{\"value\": \"test\"}]'
        });

        expect(result).toEqual({ ok: true });

        const docs = await db.collection("receipts").find({}).toArray();
        expect(docs.length).toEqual(1);
        expect(docs[0].amount).toEqual(100);
        expect(docs[0].description).toEqual('Test');
    });

    it("creates an extended receipt", async () => {
        const result = await mongoLibrary.createNewReceipt({
            receiptType: 'extended',
            items: [
                {
                    tags: '[{\"value\": \"test1\"}]',
                    amount: 1
                },
                {
                    tags: '[{\"value\": \"test2\"}]',
                    amount: 2
                }
            ],
            date: new Date().toISOString().split('T')[0],
            category: 'Test',
            amount: 100,
            description: 'Test',
            tags: '[{\"value\": \"test\"}]'
        });

        expect(result).toEqual({ ok: true });

        const docs = await db.collection("receipts").find({}).toArray();
        expect(docs.length).toEqual(1);
        expect(docs[0].amount).toEqual(100);
        expect(docs[0].description).toEqual('Test');
    });

    it("rejects a receipt with missing date", async () => {

        const result = await mongoLibrary.createNewReceipt({
            receiptType: 'extended',
            items: [
                {
                    tags: '[{\"value\": \"test1\"}]',
                    amount: 1
                },
                {
                    tags: '[{\"value\": \"test2\"}]',
                    amount: 2
                }
            ],
            category: 'Test',
            amount: 100,
            description: 'Test',
            tags: '[{\"value\": \"test\"}]'
        });

        expect(result).toEqual({ ok: false, message: 'Server neobdržel data v očekávaném formátu' });
    });
});

describe("updateReceipt", () => {
    it("updates receipt amount", async () => {
        
    })
})

describe("deleteReceipt", () => {

    it("deletes a receipt with a valid id", async () => {
        const { insertedId } = await db.collection("receipts").insertOne({ description: "test", amount: 100 });

        const result = await mongoLibrary.deleteReceipt(insertedId.toString());
        expect(result).toEqual({ ok: true });

        const doc = await db.collection("receipts").findOne({ _id: insertedId.toString() });
        expect(doc).toBeNull();
    });

    it("returns ok: false when id is undefined", async () => {
        const result = await mongoLibrary.deleteReceipt(undefined);
        expect(result.ok).toEqual(false);
        expect(result.message).toContain("Při mazání účtenky došlo k chybě");
    });

    it("returns ok: false when id is an empty string", async () => {
        const result = await mongoLibrary.deleteReceipt("");
        expect(result.ok).toEqual(false);
        expect(result.message).toContain("Při mazání účtenky došlo k chybě");
    });

});