import { S3Client, ListObjectsV2Command, PutObjectAclCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
dotenv.config();

const s3Endpoint = process.env.S3_ENDPOINT || "https://s3.us-west-or.io.cloud.ovh.us/";
const s3Region = process.env.S3_REGION || "us-west-or";
const s3AccessKey = process.env.S3_ACCESS_KEY;
const s3SecretKey = process.env.S3_SECRET_KEY;
const s3BucketName = process.env.S3_BUCKET_NAME || "basaltcrm";

if (!s3AccessKey || !s3SecretKey) {
    console.error("Missing S3 credentials in environment.");
    process.exit(1);
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

async function fixAcls() {
    console.log(`Checking S3 bucket [${s3BucketName}] at endpoint [${s3Endpoint}]`);

    try {
        let isTruncated = true;
        let continuationToken: string | undefined = undefined;
        let successCount = 0;
        let errorCount = 0;

        while (isTruncated) {
            const listCommand: any = new ListObjectsV2Command({
                Bucket: s3BucketName,
                MaxKeys: 1000,
                ContinuationToken: continuationToken,
            });

            const response: any = await s3Client.send(listCommand);
            const { Contents, IsTruncated, NextContinuationToken } = response;

            if (Contents) {
                for (const item of Contents) {
                    if (!item.Key) continue;
                    try {
                        const aclCommand = new PutObjectAclCommand({
                            Bucket: s3BucketName,
                            Key: item.Key,
                            ACL: "public-read",
                        });
                        await s3Client.send(aclCommand);
                        console.log(`Updated ACL to public-read for: ${item.Key}`);
                        successCount++;
                    } catch (error: any) {
                        console.error(`Failed to update ACL for ${item.Key}: ${error.message}`);
                        errorCount++;
                    }
                }
            }

            isTruncated = IsTruncated ?? false;
            continuationToken = NextContinuationToken;
        }

        console.log(`\nFinished updating ACLs! Successfully updated ${successCount} files. Failed: ${errorCount}.`);
    } catch (e: any) {
        console.error("Fatal error fixing ACLs:", e.message);
    }
}

fixAcls().catch(console.error);
