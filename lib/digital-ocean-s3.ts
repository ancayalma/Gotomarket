import { S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Lazily constructs an S3 client for Universal S3 (AWS/OVH/Azure) or DigitalOcean Spaces.
 * Reads environment variables at call-time to avoid build-time failures.
 * Supports the new STORAGE_PROVIDER=s3 configuration approach.
 */
export function getS3Client(): S3 {
  // Check for universal S3 configuration first
  if (process.env.STORAGE_PROVIDER === "s3" || process.env.S3_ENDPOINT) {
    const {
      S3_ENDPOINT,
      S3_REGION,
      S3_ACCESS_KEY,
      S3_SECRET_KEY,
    } = process.env;

    if (!S3_ENDPOINT || !S3_REGION || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
      throw new Error(
        "S3 Object Storage configuration missing (S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY)"
      );
    }

    return new S3({
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      // Important for alternative S3 providers like OVH or MinIO
      forcePathStyle: true,
    });
  }

  // Legacy fallback for DigitalOcean Spaces
  const {
    DO_ENDPOINT,
    DO_REGION,
    DO_ACCESS_KEY_ID,
    DO_ACCESS_KEY_SECRET,
  } = process.env;

  if (!DO_ENDPOINT || !DO_REGION || !DO_ACCESS_KEY_ID || !DO_ACCESS_KEY_SECRET) {
    throw new Error(
      "S3 storage configuration missing. Expected S3_ variables or DO_ variables."
    );
  }

  return new S3({
    endpoint: DO_ENDPOINT,
    region: DO_REGION,
    credentials: {
      accessKeyId: DO_ACCESS_KEY_ID,
      secretAccessKey: DO_ACCESS_KEY_SECRET,
    },
    forcePathStyle: true, // often needed for non-AWS providers too
  });
}

export { getSignedUrl };
