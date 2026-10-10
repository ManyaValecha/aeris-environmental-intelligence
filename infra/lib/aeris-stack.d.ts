import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as events from 'aws-cdk-lib/aws-events';
import * as iot from 'aws-cdk-lib/aws-iot';
export interface AerisStackProps extends cdk.StackProps {
    bedrockModelId?: string;
}
export declare class AerisStack extends cdk.Stack {
    readonly telemetryTable: dynamodb.Table;
    readonly artifactBucket: s3.Bucket;
    readonly ingestionLambda: lambda.Function;
    readonly apiLambda: lambda.Function;
    readonly restApi: apigateway.RestApi;
    readonly scheduledRule: events.Rule;
    readonly iotRule?: iot.CfnTopicRule;
    constructor(scope: Construct, id: string, props?: AerisStackProps);
}
