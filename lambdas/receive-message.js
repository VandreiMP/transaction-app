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
            var idTeste = crypto.randomUUID();
            var valorTeste = message.valor;
            const tipoTeste = message.tipo;
            if (data.Count > 0) {
                valorTeste = tipoTeste == "S" ? (data.Items[0].valor - valorTeste) : (data.Items[0].valor + valorTeste)
                idTeste = data.Items[0].id;
            }
            const params = {
                TableName: 'Balance',
                Item: {
                    id: idTeste,
                    valor: valorTeste,
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