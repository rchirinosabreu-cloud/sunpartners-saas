const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Railway Bucket Credentials (v34.1)
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: true // Needed for many S3-compatible providers
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'spacious-basketcase-tyj2mc';

module.exports = { s3Client, BUCKET_NAME };
