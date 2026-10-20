import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.RUMPTY_S3_REGION || "olas-closet",
  endpoint: process.env.RUMPTY_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.RUMPTY_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.RUMPTY_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Needed for custom S3 endpoints
});