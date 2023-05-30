const AWS = require('aws-sdk');

const dynamoDBClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event, context) => {
    try {
        for (const record of event.Records) {

            const item = record.dynamodb.NewImage;
console.log("antes params");
            const sqsParams = {
                MessageBody: JSON.stringify(item),
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/328864242514/TransactionAppStack-TransactionAppStackTransactionAppStackTransacti-iDf1xYY0vcU9'
            };
            console.log("depois params");
            await sqs.sendMessage(sqsParams).promise();
            console.log("depois send");
        }

        return {
            statusCode: 200,
            body: 'Informações enviadas para a fila SQS com sucesso.'
        };
    } catch (error) {
        console.error('Ocorreu um erro:', error);
        return {
            statusCode: 500,
            body: 'Erro ao processar a função Lambda.'
        };
    }
};