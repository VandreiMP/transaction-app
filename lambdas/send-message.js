const AWS = require('aws-sdk');

const dynamoDBClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

exports.handler = async (event, context) => {
    try {
        for (const record of event.Records) {

            const item = record.dynamodb.NewImage;

            const sqsParams = {
                MessageBody: JSON.stringify(item),
                QueueUrl: 'https://sqs.us-east-1.amazonaws.com/328864242514/TransactionAppStack-TransactionAppStackSaldoQueue78833CF08r3XAmd3b1-qirfilnw2iie'
            };

            await sqs.sendMessage(sqsParams).promise();

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