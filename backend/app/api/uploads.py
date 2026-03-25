from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
import uuid
from app.core.config import settings
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str

class PresignedUrlResponse(BaseModel):
    url: str
    file_key: str

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1'
    )

@router.post("/presigned-url", response_model=PresignedUrlResponse)
def generate_presigned_url(
    req: PresignedUrlRequest,
    current_user: User = Depends(get_current_active_user)
):
    s3_client = get_s3_client()
    try:
        s3_client.head_bucket(Bucket=settings.MINIO_BUCKET_NAME)
    except ClientError:
        try:
            s3_client.create_bucket(Bucket=settings.MINIO_BUCKET_NAME)
        except Exception:
            pass
        
    file_extension = req.filename.split('.')[-1] if '.' in req.filename else ''
    file_key = f"{current_user.id}/{uuid.uuid4()}.{file_extension}"
    
    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.MINIO_BUCKET_NAME,
                'Key': file_key,
                'ContentType': req.content_type
            },
            ExpiresIn=3600
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Could not generate presigned URL")
        
    return {"url": response, "file_key": file_key}

@router.get("/presigned-url/get")
def get_presigned_url(
    file_key: str,
    current_user: User = Depends(get_current_active_user)
):
    s3_client = get_s3_client()
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.MINIO_BUCKET_NAME,
                'Key': file_key
            },
            ExpiresIn=3600
        )
        return {"url": response}
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Could not generate download URL")
