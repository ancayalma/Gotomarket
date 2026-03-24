import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Acts as a shim for existing Azure Blob implementations
 * Redirects uploads and deletes to OVH S3.
 * SOC2 Update: Removed public-read ACLs and added presigned URL support.
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
        getPresignedUrl: async (key: string, expiresIn: number = 3600) => {
            const command = new GetObjectCommand({
                Bucket: s3BucketName,
                Key: key,
            });
            return await getSignedUrl(s3Client, command, { expiresIn });
        },
        getContainerClient: (containerFallbackName: string) => {
            return {
                createIfNotExists: async () => ({ succeeded: true }),
                getBlockBlobClient: (key: string) => {
                    return {
                        uploadData: async (buffer: Buffer | ArrayBuffer, options?: any) => {
                            const contentType = options?.blobHTTPHeaders?.blobContentType || "application/octet-stream";
                            const putParams: any = {
                                Bucket: s3BucketName,
                                Key: key,
                                Body: buffer instanceof ArrayBuffer ? Buffer.from(buffer) : buffer,
                                ContentType: contentType,
                            };
                            // Allow public-read for assets that must be served in emails (logos, banners)
                            if (options?.publicAccess) {
                                putParams.ACL = "public-read";
                            }
                            await s3Client.send(new PutObjectCommand(putParams));
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
                        // This URL will now be private. Use getPresignedUrl for temporary access.
                        url: `https://${s3BucketName}.s3.${s3Region}.io.cloud.ovh.us/${key}`
                    };
                }
            };
        }
    };
}
