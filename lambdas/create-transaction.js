const { DynamoDB } = require('aws-sdk');
const crypto = require('crypto');

exports.handler = async function (event, context) {
    const transaction = {
        id: crypto.randomUUID(),
        ...JSON.parse(event.body)
    }
    try {
        const docClient = new DynamoDB.DocumentClient();
        await docClient.put({
            TableName: 'Transaction',
            Item: transaction,
        }).promise();
        
        return {
            statusCode: 201,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction),
        };
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return { statusCode: 500, body: 'Failed to create transaction' };
    }
};