const { Queue } = require("aws-cdk-lib/aws-sqs");
const { Stack, RemovalPolicy, Duration } = require('aws-cdk-lib');
const { Function, Runtime, Code, StartingPosition } = require('aws-cdk-lib/aws-lambda');
const { RestApi, LambdaIntegration } = require('aws-cdk-lib/aws-apigateway');
const { Table, AttributeType, StreamViewType } = require("aws-cdk-lib/aws-dynamodb");
const { SqsEventSource, DynamoEventSource } = require("aws-cdk-lib/aws-lambda-event-sources");
const { DynamoDB } = require('aws-sdk');

class TransactionAppStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */

  constructor(scope, id, props) {

    super(scope, id, props);

    const transactionTable = new Table(this, 'Transaction', {
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'Transaction',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const balanceTable = new Table(this, 'Balance', {
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'Balance',
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const saldoQueue = new Queue(this, 'TransactionQueue', {
      visibilityTimeout: Duration.seconds(300),

    });

    const createTransaction = new Function(this, 'CreateTransaction', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambdas'),
      handler: 'create-transaction.handler',
    });

    const sendMessage = new Function(this, 'SendMessage', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambdas'),
      handler: 'send-message.handler',
      environment: {
        QUEUE_URL: saldoQueue.queueUrl,
      },
    });

    const receiveMessage = new Function(this, 'ReceiveMessage', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambdas'),
      handler: 'receive-message.handler',
      environment: {
        QUEUE_URL: saldoQueue.queueUrl,
      },
    });

    const getBalance = new Function(this, 'GetBalance', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambdas'),
      handler: 'get-balance.handler',
    });

    transactionTable.grantWriteData(createTransaction);
    saldoQueue.grantSendMessages(sendMessage);
    transactionTable.grantReadData(sendMessage);
    saldoQueue.grantConsumeMessages(receiveMessage);
    balanceTable.grantReadWriteData(receiveMessage);
    balanceTable.grantReadData(getBalance);

    sendMessage.addEventSource(new DynamoEventSource(transactionTable, {
      startingPosition: StartingPosition.LATEST,
    }));

    receiveMessage.addEventSource(new SqsEventSource(saldoQueue, {
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(5),
      reportBatchItemFailures: true,
    }));

    const api = new RestApi(this, 'TransactionApi', {
      restApiName: 'TransactionApi',
    });
    const transactions = api.root.addResource('transaction');
    transactions.addMethod('POST', new LambdaIntegration(createTransaction));
    const balance = api.root.addResource("balance");
    balance.addMethod("GET", new LambdaIntegration(getBalance));

  }
}

module.exports = { TransactionAppStack }