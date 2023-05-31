const { DynamoDB } = require('aws-sdk');

exports.handler = async function (event, context) {

    try {
        const docClient = new DynamoDB.DocumentClient();
        const data = await docClient.scan({ TableName: "Balance" }).promise();
        var saldo = 0;
        if (data.Count > 0) {
            saldo = data.Items[0].valor;
        }
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "saldo": saldo }),
        };
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return { statusCode: 500, body: 'Failed to create transaction' };
    }
};