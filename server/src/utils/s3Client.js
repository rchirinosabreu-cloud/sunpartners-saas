const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Railway Bucket Credentials (v36.3 definitive mapping)
const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_DEFAULT_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  forcePathStyle: true // Needed for many S3-compatible providers
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

module.exports = { s3Client, BUCKET_NAME };
