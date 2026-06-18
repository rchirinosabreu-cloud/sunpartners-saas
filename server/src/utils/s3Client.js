const { S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
try { require('dotenv').config(); } catch (e) {}

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

/**
 * Generates a temporary signed URL for a private S3 object (v38.0)
 * @param {string} key - The object key in the bucket
 * @param {number} expiresIn - Expiration time in seconds (default 24h)
 */
const getSignedUrlHelper = async (key, expiresIn = 86400) => {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

module.exports = { s3Client, BUCKET_NAME, getSignedUrlHelper, DeleteObjectCommand };
