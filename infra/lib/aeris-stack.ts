import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface AerisStackProps extends cdk.StackProps {
  bedrockModelId?: string;
}

export class AerisStack extends cdk.Stack {
  public readonly telemetryTable: dynamodb.Table;
  public readonly artifactBucket: s3.Bucket;
  public readonly ingestionLambda: lambda.Function;
  public readonly apiLambda: lambda.Function;
  public readonly restApi: apigateway.RestApi;
  public readonly scheduledRule: events.Rule;
  public readonly iotRule?: iot.CfnTopicRule;

  constructor(scope: Construct, id: string, props?: AerisStackProps) {
    super(scope, id, props);

    const bedrockModelId = props?.bedrockModelId || 'us.amazon.nova-micro-v1:0';

    // ─── 1. DynamoDB Table ───────────────────────────────────────────────────
    this.telemetryTable = new dynamodb.Table(this, 'AerisTelemetryTable', {
      tableName: 'AerisTelemetry',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // STATION#{stationId}
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },      // TIMESTAMP#{ISO_TIMESTAMP}
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // ─── 2. S3 Bucket (Model Artifacts & Datasets) ───────────────────────────
    this.artifactBucket = new s3.Bucket(this, 'AerisArtifactBucket', {
      bucketName: `aeris-model-artifacts-${this.account}-${this.region}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ExpireRawExports90Days',
          prefix: 'exports/',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // ─── 3. Lambda Ingestion Function ─────────────────────────────────────────
    const lambdaLogGroup = new logs.LogGroup(this, 'IngestionLogGroup', {
      logGroupName: '/aws/lambda/aeris-ingestion-handler',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.ingestionLambda = new lambda.Function(this, 'IngestionLambda', {
      functionName: 'aeris-ingestion-handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'ingest.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: this.telemetryTable.tableName,
        BUCKET_NAME: this.artifactBucket.bucketName,
      },
      logGroup: lambdaLogGroup,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
    });

    this.telemetryTable.grantWriteData(this.ingestionLambda);
    this.artifactBucket.grantReadWrite(this.ingestionLambda);

    // ─── 4. API Proxy Lambda Function ─────────────────────────────────────────
    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: '/aws/lambda/aeris-api-handler',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.apiLambda = new lambda.Function(this, 'ApiLambda', {
      functionName: 'aeris-api-handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'api.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: this.telemetryTable.tableName,
        BEDROCK_MODEL_ID: bedrockModelId,
      },
      logGroup: apiLogGroup,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
    });

    this.telemetryTable.grantReadWriteData(this.apiLambda);

    // Bedrock Least-Privilege IAM Permission
    this.apiLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/*`,
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      })
    );

    // ─── 5. API Gateway REST API ──────────────────────────────────────────────
    this.restApi = new apigateway.RestApi(this, 'AerisRestApi', {
      restApiName: 'AERIS Environmental Intelligence API',
      description: 'REST API for Delhi NCR Air Quality Telemetry, History, and Ingestion.',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Api-Key'],
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(this.apiLambda);

    const stationsRes = this.restApi.root.addResource('stations');
    stationsRes.addMethod('GET', lambdaIntegration); // GET /stations

    const stationIdRes = stationsRes.addResource('{stationId}');
    const latestRes = stationIdRes.addResource('latest');
    latestRes.addMethod('GET', lambdaIntegration);   // GET /stations/{stationId}/latest

    const historyRes = stationIdRes.addResource('history');
    historyRes.addMethod('GET', lambdaIntegration);  // GET /stations/{stationId}/history

    const telemetryRes = this.restApi.root.addResource('telemetry');
    telemetryRes.addMethod('POST', lambdaIntegration); // POST /telemetry
    const copilotRes = this.restApi.root.addResource('copilot');
    copilotRes.addMethod('POST', lambdaIntegration); // POST /copilot

    // ─── 6. EventBridge Scheduled Ingestion ──────────────────────────────────
    this.scheduledRule = new events.Rule(this, 'AerisScheduledIngestionRule', {
      ruleName: 'aeris-15min-ingestion-rule',
      description: 'Triggers periodic simulated/reanalysis telemetry ingestion every 15 minutes',
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
    });

    this.scheduledRule.addTarget(new targets.LambdaFunction(this.ingestionLambda));

    // ─── 7. IoT Core Optional Ingestion Path ──────────────────────────────────
    const iotRole = new iam.Role(this, 'AerisIotRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
      description: 'Role allowing IoT Core rule to invoke AERIS ingestion Lambda',
    });

    this.ingestionLambda.grantInvoke(iotRole);

    this.iotRule = new iot.CfnTopicRule(this, 'AerisIotTelemetryRule', {
      ruleName: 'AerisStationTelemetryRule',
      topicRulePayload: {
        sql: "SELECT * FROM 'aeris/stations/+/telemetry'",
        description: 'Routes MQTT telemetry from Delhi NCR stations to AERIS Ingestion Lambda',
        actions: [
          {
            lambda: {
              functionArn: this.ingestionLambda.functionArn,
            },
          },
        ],
        ruleDisabled: false,
      },
    });

    // ─── 8. CloudWatch Observability ──────────────────────────────────────────
    new cloudwatch.Alarm(this, 'IngestionErrorsAlarm', {
      alarmName: 'aeris-ingestion-errors-alarm',
      metric: this.ingestionLambda.metricErrors({ period: cdk.Duration.minutes(5) }),
      threshold: 3,
      evaluationPeriods: 1,
      alarmDescription: 'Alerts when ingestion Lambda fails >= 3 times in 5 minutes',
    });

    // ─── Outputs ──────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.restApi.url,
      description: 'Production API Gateway Endpoint Base URL',
      exportName: 'AerisApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.telemetryTable.tableName,
      description: 'DynamoDB Telemetry Table Name',
    });

    new cdk.CfnOutput(this, 'S3ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'S3 Model Artifact Storage Bucket Name',
    });
  }
}
