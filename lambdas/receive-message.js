const { DynamoDB } = require('aws-sdk');
const crypto = require('crypto');

exports.handler = async (event, context) => {
    try {
        const docClient = new DynamoDB.DocumentClient();
        const data = await docClient.scan({
            TableName: 'Balance',
        }).promise();

        for (const record of event.Records) {
            const message = JSON.parse(record.body);
            var idBalance = crypto.randomUUID();
            var valorBalance = message.valor;
            const tipoTransaction = message.tipo;
            if (data.Count > 0) {
                valorBalance = tipoTransaction == "S" ? (data.Items[0].valor - valorBalance) : (data.Items[0].valor + valorBalance)
                idBalance = data.Items[0].id;
            }
            const params = {
                TableName: 'Balance',
                Item: {
                    id: idBalance,
                    valor: valorBalance,
                }
            };
            await docClient.put(params).promise();
            console.log('Saldo inserido no DynamoDB:', params.Item);
        }

        return {
            statusCode: 200,
            body: 'Mensagens da fila SQS processadas com sucesso.'
        };
    } catch (error) {
        console.error('Ocorreu um erro:', error);
        return {
            statusCode: 500,
            body: 'Erro ao processar a função Lambda.'
        };
    }
};