import json
import boto3
import time
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sns = boto3.client('sns')

table_name = 'AirQualityData'  # Your DynamoDB table name
bucket_name = 'air-quality-logs'  # Your S3 bucket name
sns_topic_arn = 'arn:aws:sns:ap-south-1:568555766927:AirQualityAlert'  # Replace with your actual ARN

table = dynamodb.Table(table_name)

# Convert floats to Decimals for DynamoDB
def convert_floats_to_decimal(obj):
    if isinstance(obj, list):
        return [convert_floats_to_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            if k == 'timestamp':
                new_obj[k] = Decimal(str(int(v)))  # Store timestamp as integer
            else:
                new_obj[k] = convert_floats_to_decimal(v)
        return new_obj
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj

def lambda_handler(event, context):
    try:
        # Handle data from IoT Core or test input
        payload = json.loads(event['Records'][0]['body']) if 'Records' in event else event
        print("Received payload:", payload)

        # Store in DynamoDB
        decimal_payload = convert_floats_to_decimal(payload)
        table.put_item(Item=decimal_payload)

        # Store raw JSON to S3 for QuickSight
        filename = f"data_{int(time.time())}.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=json.dumps(payload)
        )

        # Send alert if air quality exceeds threshold
        if payload.get('pm25', 0) > 80 or payload.get('co2', 0) > 1000:
            message = f"⚠️ Air Quality Alert:\n{json.dumps(payload, indent=2)}"
            sns.publish(
                TopicArn=sns_topic_arn,
                Message=message,
                Subject="Air Quality Alert"
            )

        return {
            'statusCode': 200,
            'body': json.dumps('Data stored successfully')
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps('Error storing data: ' + str(e))
        }
