import { BlobServiceClient } from "@azure/storage-blob";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import "dotenv/config";
import { Readable } from "stream";

/**
 * Migration Utility: Azure Blob Storage -> Universal S3 (OVH/AWS/MinIO)
 * Run via: npx ts-node scripts/migrate-blob-to-s3.ts
 */

const azureConnectionString = process.env.BLOB_STORAGE_CONNECTION_STRING;
const azureContainerName = process.env.BLOB_STORAGE_CONTAINER;

const s3Endpoint = process.env.S3_ENDPOINT;
const s3Region = process.env.S3_REGION || "us-east-1";
const s3AccessKey = process.env.S3_ACCESS_KEY;
const s3SecretKey = process.env.S3_SECRET_KEY;
const s3BucketName = process.env.S3_BUCKET_NAME;

if (!azureConnectionString || !azureContainerName) {
    console.error("❌ Missing Azure configuration variables in environment.");
    process.exit(1);
}

if (!s3AccessKey || !s3SecretKey || !s3BucketName) {
    console.error("❌ Missing S3 configuration variables in environment.");
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

const blobServiceClient = BlobServiceClient.fromConnectionString(azureConnectionString);
const containerClient = blobServiceClient.getContainerClient(azureContainerName);

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}

async function migrate() {
    console.log(`🚀 Starting migration from Azure [${azureContainerName}] to S3 [${s3BucketName}]...`);

    try {
        let migratedCount = 0;
        let failedCount = 0;

        for await (const blob of containerClient.listBlobsFlat()) {
            console.log(`\n📦 Processing blob: ${blob.name} (${blob.properties.contentLength} bytes)`);

            try {
                const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
                const downloadResponse = await blockBlobClient.download(0);

                if (!downloadResponse.readableStreamBody) {
                    throw new Error("Unable to download readable stream from Azure.");
                }

                const buffer = await streamToBuffer(downloadResponse.readableStreamBody);

                console.log(`   ⬆️ Uploading to S3...`);
                const parallelUploads3 = new Upload({
                    client: s3Client,
                    params: {
                        Bucket: s3BucketName,
                        Key: blob.name,
                        Body: buffer,
                        ContentType: blob.properties.contentType || "application/octet-stream",
                        ACL: "public-read",
                    },
                });

                await parallelUploads3.done();
                console.log(`   ✅ Success: ${blob.name}`);
                migratedCount++;
            } catch (err: any) {
                console.error(`   ❌ Failed to migrate ${blob.name}:`, err.message);
                failedCount++;
            }
        }

        console.log(`\n🎉 Migration Complete!`);
        console.log(`📊 Successfully migrated: ${migratedCount} files`);
        if (failedCount > 0) {
            console.log(`⚠️ Failed migrations: ${failedCount} files`);
        }

    } catch (err: any) {
        console.error("Critical migration error:", err.message);
    }
}

migrate()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
