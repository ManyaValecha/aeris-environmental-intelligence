from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import json, time, random

client = AWSIoTMQTTClient("sensorClient")
client.configureEndpoint("a25kby98bw65kv-ats.iot.ap-south-1.amazonaws.com", 8883)
client.configureCredentials("AmazonRootCA1 (1).pem", "6201f8f44091ad4314dcc815b188e002db8ccc90e0c22d32ac42c4f09f585c13-private.pem.key", "6201f8f44091ad4314dcc815b188e002db8ccc90e0c22d32ac42c4f09f585c13-certificate.pem.crt")

client.connect()
print("Connected to AWS IoT")

while True:
    payload = {
        "temperature": round(random.uniform(25, 38), 2),
        "humidity": round(random.uniform(30, 60), 2),
        "pm25": round(random.uniform(5, 100), 2),
        "co2": round(random.uniform(400, 1500), 2),
        "timestamp": time.time()
    }
    print("Publishing:", payload)
    client.publish("air/monitoring/data", json.dumps(payload), 1)
    time.sleep(10)
