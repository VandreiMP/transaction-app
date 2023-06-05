const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event, context) => {
    try {
        for (const record of event.Records) {
            const mapInsert = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
            const sqsParams = {
                MessageBody: JSON.stringify(mapInsert),
                QueueUrl: process.env.QUEUE_URL
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