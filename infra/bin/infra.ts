#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AerisStack } from '../lib/aeris-stack';

const app = new cdk.App();

new AerisStack(app, 'AerisStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'AERIS — AI Environmental Response & Intelligence System (AWS Stack)',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0',
});

app.synth();
