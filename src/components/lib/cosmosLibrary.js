const { CosmosClient, Container} = require('@azure/cosmos');
const cosmosConnectionString = process.env['CosmosConnectionString'];

const client = new CosmosClient(cosmosConnectionString)