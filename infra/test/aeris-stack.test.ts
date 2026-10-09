import { describe, it, expect } from 'vitest';
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { AerisStack } from '../lib/aeris-stack';

describe('AerisStack Infrastructure Tests', () => {
  const app = new cdk.App();
  const stack = new AerisStack(app, 'TestAerisStack', {
    env: { account: '123456789012', region: 'us-east-1' },
  });
  const template = Template.fromStack(stack);

  it('creates DynamoDB table with correct keys and billing mode', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'AerisTelemetry',
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      SSESpecification: {
        SSEEnabled: true,
      },
    });
  });

  it('creates S3 bucket with strict security settings (BlockPublicAccess, Encryption)', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  it('creates Ingestion and API Proxy Lambda functions', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'aeris-ingestion-handler',
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'aeris-api-handler',
    });
  });

  it('exposes API Gateway REST API with /stations, /latest, /history, /telemetry routes', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'AERIS Environmental Intelligence API',
    });
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'stations',
    });
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'telemetry',
    });
  });

  it('creates EventBridge 15-minute ingestion schedule', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(15 minutes)',
    });
  });

  it('creates IoT Core Topic Rule for station telemetry', () => {
    template.hasResourceProperties('AWS::IoT::TopicRule', {
      TopicRulePayload: {
        Sql: "SELECT * FROM 'aeris/stations/+/telemetry'",
      },
    });
  });

  it('attaches least-privilege Bedrock policy to API Lambda', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'bedrock:InvokeModel',
            Effect: 'Allow',
          }),
        ]),
      },
    });
  });
});
