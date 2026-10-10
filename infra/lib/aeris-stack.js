"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AerisStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const iot = __importStar(require("aws-cdk-lib/aws-iot"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const path = __importStar(require("path"));
class AerisStack extends cdk.Stack {
    telemetryTable;
    artifactBucket;
    ingestionLambda;
    apiLambda;
    restApi;
    scheduledRule;
    iotRule;
    constructor(scope, id, props) {
        super(scope, id, props);
        const bedrockModelId = props?.bedrockModelId || 'us.amazon.nova-micro-v1:0';
        // ─── 1. DynamoDB Table ───────────────────────────────────────────────────
        this.telemetryTable = new dynamodb.Table(this, 'AerisTelemetryTable', {
            tableName: 'AerisTelemetry',
            partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING }, // STATION#{stationId}
            sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING }, // TIMESTAMP#{ISO_TIMESTAMP}
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
        this.apiLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: [
                `arn:aws:bedrock:${this.region}::foundation-model/*`,
                `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
            ],
        }));
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
        latestRes.addMethod('GET', lambdaIntegration); // GET /stations/{stationId}/latest
        const historyRes = stationIdRes.addResource('history');
        historyRes.addMethod('GET', lambdaIntegration); // GET /stations/{stationId}/history
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
exports.AerisStack = AerisStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWVyaXMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhZXJpcy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFFbkMsbUVBQXFEO0FBQ3JELHVEQUF5QztBQUN6QywrREFBaUQ7QUFDakQsdUVBQXlEO0FBQ3pELCtEQUFpRDtBQUNqRCx3RUFBMEQ7QUFDMUQseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyx1RUFBeUQ7QUFDekQsMkRBQTZDO0FBQzdDLDJDQUE2QjtBQU03QixNQUFhLFVBQVcsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN2QixjQUFjLENBQWlCO0lBQy9CLGNBQWMsQ0FBWTtJQUMxQixlQUFlLENBQWtCO0lBQ2pDLFNBQVMsQ0FBa0I7SUFDM0IsT0FBTyxDQUFxQjtJQUM1QixhQUFhLENBQWM7SUFDM0IsT0FBTyxDQUFvQjtJQUUzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sY0FBYyxHQUFHLEtBQUssRUFBRSxjQUFjLElBQUksMkJBQTJCLENBQUM7UUFFNUUsNEVBQTRFO1FBQzVFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNwRSxTQUFTLEVBQUUsZ0JBQWdCO1lBQzNCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQUUsc0JBQXNCO1lBQ3pGLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLEVBQU8sNEJBQTRCO1lBQy9GLFdBQVcsRUFB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QUFzQixFQUFFO1lBQ2pELFNBQVMsRUFBRSw4QkFBOEI7WUFDekMsTUFBTSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDOUUsU0FBUyxFQUFFLENBQUM7WUFDWixpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLGdCQUFnQixFQUFFLDREQUE0RDtTQUMvRSxDQUFDLENBQUM7UUFFSCw2RUFBNkU7UUFDN0UsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRztZQUN2QixXQUFXLEVBQUUsMENBQTBDO1lBQ3ZELFVBQVUsRUFBRSxvQkFBb0I7U0FDakMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTO1lBQ3BDLFdBQVcsRUFBRSwrQkFBK0I7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUM5QyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVO1lBQ3JDLFdBQVcsRUFBRSx1Q0FBdUM7U0FDckQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBak1ELGdDQWlNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBpb3QgZnJvbSAnYXdzLWNkay1saWIvYXdzLWlvdCc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBBZXJpc1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGJlZHJvY2tNb2RlbElkPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQWVyaXNTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSB0ZWxlbWV0cnlUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBhcnRpZmFjdEJ1Y2tldDogczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgaW5nZXN0aW9uTGFtYmRhOiBsYW1iZGEuRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSBhcGlMYW1iZGE6IGxhbWJkYS5GdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IHJlc3RBcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IHNjaGVkdWxlZFJ1bGU6IGV2ZW50cy5SdWxlO1xuICBwdWJsaWMgcmVhZG9ubHkgaW90UnVsZT86IGlvdC5DZm5Ub3BpY1J1bGU7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBBZXJpc1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IGJlZHJvY2tNb2RlbElkID0gcHJvcHM/LmJlZHJvY2tNb2RlbElkIHx8ICd1cy5hbWF6b24ubm92YS1taWNyby12MTowJztcblxuICAgIC8vIOKUgOKUgOKUgCAxLiBEeW5hbW9EQiBUYWJsZSDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICB0aGlzLnRlbGVtZXRyeVRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdBZXJpc1RlbGVtZXRyeVRhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAnQWVyaXNUZWxlbWV0cnknLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sIC8vIFNUQVRJT04je3N0YXRpb25JZH1cbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ1NLJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSwgICAgICAvLyBUSU1FU1RBTVAje0lTT19USU1FU1RBTVB9XG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQVdTX01BTkFHRUQsXG4gICAgfSk7XG5cbiAgICAvLyDilIDilIDilIAgMi4gUzMgQnVja2V0IChNb2RlbCBBcnRpZmFjdHMgJiBEYXRhc2V0cykg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgdGhpcy5hcnRpZmFjdEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0FlcmlzQXJ0aWZhY3RCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgYWVyaXMtbW9kZWwtYXJ0aWZhY3RzLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ0V4cGlyZVJhd0V4cG9ydHM5MERheXMnLFxuICAgICAgICAgIHByZWZpeDogJ2V4cG9ydHMvJyxcbiAgICAgICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyg5MCksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8g4pSA4pSA4pSAIDMuIExhbWJkYSBJbmdlc3Rpb24gRnVuY3Rpb24g4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgY29uc3QgbGFtYmRhTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnSW5nZXN0aW9uTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6ICcvYXdzL2xhbWJkYS9hZXJpcy1pbmdlc3Rpb24taGFuZGxlcicsXG4gICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICB0aGlzLmluZ2VzdGlvbkxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0luZ2VzdGlvbkxhbWJkYScsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ2FlcmlzLWluZ2VzdGlvbi1oYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2luZ2VzdC5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldChwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vbGFtYmRhJykpLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGhpcy50ZWxlbWV0cnlUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIEJVQ0tFVF9OQU1FOiB0aGlzLmFydGlmYWN0QnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgICAgbG9nR3JvdXA6IGxhbWJkYUxvZ0dyb3VwLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTUpLFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgIH0pO1xuXG4gICAgdGhpcy50ZWxlbWV0cnlUYWJsZS5ncmFudFdyaXRlRGF0YSh0aGlzLmluZ2VzdGlvbkxhbWJkYSk7XG4gICAgdGhpcy5hcnRpZmFjdEJ1Y2tldC5ncmFudFJlYWRXcml0ZSh0aGlzLmluZ2VzdGlvbkxhbWJkYSk7XG5cbiAgICAvLyDilIDilIDilIAgNC4gQVBJIFByb3h5IExhbWJkYSBGdW5jdGlvbiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICBjb25zdCBhcGlMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdBcGlMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogJy9hd3MvbGFtYmRhL2FlcmlzLWFwaS1oYW5kbGVyJyxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIHRoaXMuYXBpTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQXBpTGFtYmRhJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiAnYWVyaXMtYXBpLWhhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnYXBpLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9sYW1iZGEnKSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiB0aGlzLnRlbGVtZXRyeVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQkVEUk9DS19NT0RFTF9JRDogYmVkcm9ja01vZGVsSWQsXG4gICAgICB9LFxuICAgICAgbG9nR3JvdXA6IGFwaUxvZ0dyb3VwLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgIH0pO1xuXG4gICAgdGhpcy50ZWxlbWV0cnlUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEodGhpcy5hcGlMYW1iZGEpO1xuXG4gICAgLy8gQmVkcm9jayBMZWFzdC1Qcml2aWxlZ2UgSUFNIFBlcm1pc3Npb25cbiAgICB0aGlzLmFwaUxhbWJkYS5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnYmVkcm9jazpJbnZva2VNb2RlbCddLFxuICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICBgYXJuOmF3czpiZWRyb2NrOiR7dGhpcy5yZWdpb259Ojpmb3VuZGF0aW9uLW1vZGVsLypgLFxuICAgICAgICAgIGBhcm46YXdzOmJlZHJvY2s6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OmluZmVyZW5jZS1wcm9maWxlLypgLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8g4pSA4pSA4pSAIDUuIEFQSSBHYXRld2F5IFJFU1QgQVBJIOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgIHRoaXMucmVzdEFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0FlcmlzUmVzdEFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnQUVSSVMgRW52aXJvbm1lbnRhbCBJbnRlbGxpZ2VuY2UgQVBJJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUkVTVCBBUEkgZm9yIERlbGhpIE5DUiBBaXIgUXVhbGl0eSBUZWxlbWV0cnksIEhpc3RvcnksIGFuZCBJbmdlc3Rpb24uJyxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiAncHJvZCcsXG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbicsICdYLUFwaS1LZXknXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBsYW1iZGFJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRoaXMuYXBpTGFtYmRhKTtcblxuICAgIGNvbnN0IHN0YXRpb25zUmVzID0gdGhpcy5yZXN0QXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3N0YXRpb25zJyk7XG4gICAgc3RhdGlvbnNSZXMuYWRkTWV0aG9kKCdHRVQnLCBsYW1iZGFJbnRlZ3JhdGlvbik7IC8vIEdFVCAvc3RhdGlvbnNcblxuICAgIGNvbnN0IHN0YXRpb25JZFJlcyA9IHN0YXRpb25zUmVzLmFkZFJlc291cmNlKCd7c3RhdGlvbklkfScpO1xuICAgIGNvbnN0IGxhdGVzdFJlcyA9IHN0YXRpb25JZFJlcy5hZGRSZXNvdXJjZSgnbGF0ZXN0Jyk7XG4gICAgbGF0ZXN0UmVzLmFkZE1ldGhvZCgnR0VUJywgbGFtYmRhSW50ZWdyYXRpb24pOyAgIC8vIEdFVCAvc3RhdGlvbnMve3N0YXRpb25JZH0vbGF0ZXN0XG5cbiAgICBjb25zdCBoaXN0b3J5UmVzID0gc3RhdGlvbklkUmVzLmFkZFJlc291cmNlKCdoaXN0b3J5Jyk7XG4gICAgaGlzdG9yeVJlcy5hZGRNZXRob2QoJ0dFVCcsIGxhbWJkYUludGVncmF0aW9uKTsgIC8vIEdFVCAvc3RhdGlvbnMve3N0YXRpb25JZH0vaGlzdG9yeVxuXG4gICAgY29uc3QgdGVsZW1ldHJ5UmVzID0gdGhpcy5yZXN0QXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3RlbGVtZXRyeScpO1xuICAgIHRlbGVtZXRyeVJlcy5hZGRNZXRob2QoJ1BPU1QnLCBsYW1iZGFJbnRlZ3JhdGlvbik7IC8vIFBPU1QgL3RlbGVtZXRyeVxuICAgIGNvbnN0IGNvcGlsb3RSZXMgPSB0aGlzLnJlc3RBcGkucm9vdC5hZGRSZXNvdXJjZSgnY29waWxvdCcpO1xuICAgIGNvcGlsb3RSZXMuYWRkTWV0aG9kKCdQT1NUJywgbGFtYmRhSW50ZWdyYXRpb24pOyAvLyBQT1NUIC9jb3BpbG90XG5cbiAgICAvLyDilIDilIDilIAgNi4gRXZlbnRCcmlkZ2UgU2NoZWR1bGVkIEluZ2VzdGlvbiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICB0aGlzLnNjaGVkdWxlZFJ1bGUgPSBuZXcgZXZlbnRzLlJ1bGUodGhpcywgJ0FlcmlzU2NoZWR1bGVkSW5nZXN0aW9uUnVsZScsIHtcbiAgICAgIHJ1bGVOYW1lOiAnYWVyaXMtMTVtaW4taW5nZXN0aW9uLXJ1bGUnLFxuICAgICAgZGVzY3JpcHRpb246ICdUcmlnZ2VycyBwZXJpb2RpYyBzaW11bGF0ZWQvcmVhbmFseXNpcyB0ZWxlbWV0cnkgaW5nZXN0aW9uIGV2ZXJ5IDE1IG1pbnV0ZXMnLFxuICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5yYXRlKGNkay5EdXJhdGlvbi5taW51dGVzKDE1KSksXG4gICAgfSk7XG5cbiAgICB0aGlzLnNjaGVkdWxlZFJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKHRoaXMuaW5nZXN0aW9uTGFtYmRhKSk7XG5cbiAgICAvLyDilIDilIDilIAgNy4gSW9UIENvcmUgT3B0aW9uYWwgSW5nZXN0aW9uIFBhdGgg4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gICAgY29uc3QgaW90Um9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnQWVyaXNJb3RSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2lvdC5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ1JvbGUgYWxsb3dpbmcgSW9UIENvcmUgcnVsZSB0byBpbnZva2UgQUVSSVMgaW5nZXN0aW9uIExhbWJkYScsXG4gICAgfSk7XG5cbiAgICB0aGlzLmluZ2VzdGlvbkxhbWJkYS5ncmFudEludm9rZShpb3RSb2xlKTtcblxuICAgIHRoaXMuaW90UnVsZSA9IG5ldyBpb3QuQ2ZuVG9waWNSdWxlKHRoaXMsICdBZXJpc0lvdFRlbGVtZXRyeVJ1bGUnLCB7XG4gICAgICBydWxlTmFtZTogJ0FlcmlzU3RhdGlvblRlbGVtZXRyeVJ1bGUnLFxuICAgICAgdG9waWNSdWxlUGF5bG9hZDoge1xuICAgICAgICBzcWw6IFwiU0VMRUNUICogRlJPTSAnYWVyaXMvc3RhdGlvbnMvKy90ZWxlbWV0cnknXCIsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUm91dGVzIE1RVFQgdGVsZW1ldHJ5IGZyb20gRGVsaGkgTkNSIHN0YXRpb25zIHRvIEFFUklTIEluZ2VzdGlvbiBMYW1iZGEnLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFtYmRhOiB7XG4gICAgICAgICAgICAgIGZ1bmN0aW9uQXJuOiB0aGlzLmluZ2VzdGlvbkxhbWJkYS5mdW5jdGlvbkFybixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcnVsZURpc2FibGVkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyDilIDilIDilIAgOC4gQ2xvdWRXYXRjaCBPYnNlcnZhYmlsaXR5IOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgFxuICAgIG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdJbmdlc3Rpb25FcnJvcnNBbGFybScsIHtcbiAgICAgIGFsYXJtTmFtZTogJ2FlcmlzLWluZ2VzdGlvbi1lcnJvcnMtYWxhcm0nLFxuICAgICAgbWV0cmljOiB0aGlzLmluZ2VzdGlvbkxhbWJkYS5tZXRyaWNFcnJvcnMoeyBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpIH0pLFxuICAgICAgdGhyZXNob2xkOiAzLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxlcnRzIHdoZW4gaW5nZXN0aW9uIExhbWJkYSBmYWlscyA+PSAzIHRpbWVzIGluIDUgbWludXRlcycsXG4gICAgfSk7XG5cbiAgICAvLyDilIDilIDilIAgT3V0cHV0cyDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnJlc3RBcGkudXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdQcm9kdWN0aW9uIEFQSSBHYXRld2F5IEVuZHBvaW50IEJhc2UgVVJMJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdBZXJpc0FwaUdhdGV3YXlVcmwnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0R5bmFtb0RCVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMudGVsZW1ldHJ5VGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdEeW5hbW9EQiBUZWxlbWV0cnkgVGFibGUgTmFtZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUzNBcnRpZmFjdEJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hcnRpZmFjdEJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTMyBNb2RlbCBBcnRpZmFjdCBTdG9yYWdlIEJ1Y2tldCBOYW1lJyxcbiAgICB9KTtcbiAgfVxufVxuIl19