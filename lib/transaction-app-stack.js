const { Queue } = require("aws-cdk-lib/aws-sqs");
const { Stack, RemovalPolicy, Duration } = require('aws-cdk-lib');
const { Function, Runtime, Code, StartingPosition } = require('aws-cdk-lib/aws-lambda');
const { RestApi, LambdaIntegration } = require('aws-cdk-lib/aws-apigateway');
const { Table, AttributeType, StreamViewType } = require("aws-cdk-lib/aws-dynamodb");
const { SqsEventSource, DynamoEventSource} = require("aws-cdk-lib/aws-lambda-event-sources");

class TransactionAppStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);


    const createTransaction = new Function(this, 'CreateTransaction', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambdas'),
      handler: 'create-transaction.handler',
    });

    const transactionTable = new Table(this, 'Transaction', {
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'Transaction',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const saldoQueue = new Queue(this, 'TransactionAppStack-TransactionAppStackTransactionAppStackSaldoQueu-MRKOaFmCc8tA', {
      visibilityTimeout: Duration.seconds(300),
    });

    const sendMessage = new Function(this, 'SendMessage', {
      runtime: Runtime.NODEJS_14_X,
      code: Code.fromAsset('lambdas'),
      handler: 'send-message.handler',
      environment: {
        QUEUE_URL: saldoQueue.queueUrl,
      },
    });
    transactionTable.grantWriteData(createTransaction);

    sendMessage.addEventSource(new DynamoEventSource(transactionTable, {
      startingPosition: StartingPosition.LATEST,
    }));


    const api = new RestApi(this, 'TransactionApi', {
      restApiName: 'TransactionApi',
    });

    const transactions = api.root.addResource('transaction');

    transactions.addMethod('POST', new LambdaIntegration(createTransaction));

  }
}

module.exports = { TransactionAppStack }
