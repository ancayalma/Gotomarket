import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Acts as a shim for existing Azure Blob implementations
 * Redirects uploads and deletes to OVH S3.
 */
export function getBlobServiceClient() {
    const s3Endpoint = process.env.S3_ENDPOINT || "https://s3.us-west-or.io.cloud.ovh.us/";
    const s3Region = process.env.S3_REGION || "us-west-or";
    const s3AccessKey = process.env.S3_ACCESS_KEY;
    const s3SecretKey = process.env.S3_SECRET_KEY;
    const s3BucketName = process.env.S3_BUCKET_NAME || "basaltcrm";

    if (!s3AccessKey || !s3SecretKey) {
        throw new Error("S3 credentials are not defined");
    }

    const s3Client = new S3Client({
        region: s3Region,
        endpoint: s3Endpoint,
        credentials: {
            accessKeyId: s3AccessKey,
            secretAccessKey: s3SecretKey,
        },
        forcePathStyle: true,
    });

    return {
        getContainerClient: (containerFallbackName: string) => {
            return {
                createIfNotExists: async () => ({ succeeded: true }),
                getBlockBlobClient: (key: string) => {
                    return {
                        uploadData: async (buffer: Buffer | ArrayBuffer, options?: any) => {
                            const contentType = options?.blobHTTPHeaders?.blobContentType || "application/octet-stream";
                            await s3Client.send(new PutObjectCommand({
                                Bucket: s3BucketName,
                                Key: key,
                                Body: buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer,
                                ContentType: contentType,
                                ACL: "public-read"
                            }));
                        },
                        deleteIfExists: async () => {
                            try {
                                await s3Client.send(new DeleteObjectCommand({
                                    Bucket: s3BucketName,
                                    Key: key,
                                }));
                                return { succeeded: true };
                            } catch (e) {
                                return { succeeded: false };
                            }
                        },
                        url: `https://${s3BucketName}.s3.${s3Region}.io.cloud.ovh.us/${key}`
                    };
                }
            };
        }
    };
}
