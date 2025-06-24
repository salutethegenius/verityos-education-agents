from dotenv import load_dotenv

load_dotenv()
import boto3
import os

BUCKET_NAME = "verityos-core-node-01"
S3_PREFIX = "datasets/curriculum/"
LOCAL_DIR = "./data/curriculum"

s3 = boto3.client("s3")


def download_all_files():
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=S3_PREFIX):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            local_path = os.path.join(LOCAL_DIR, key.replace(S3_PREFIX, ""))

            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            print(f"Downloading {key} to {local_path}")
            s3.download_file(BUCKET_NAME, key, local_path)


if __name__ == "__main__":
    download_all_files()
