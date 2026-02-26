import { getBlobServiceClient } from "./s3-storage";

export async function deleteBlobIfConfigured(key?: string) {
  try {
    if (!key) return { skipped: true, reason: "no-key" };

    const s3Access = process.env.S3_ACCESS_KEY;
    const s3Secret = process.env.S3_SECRET_KEY;
    const container = process.env.S3_BUCKET_NAME || "basaltcrm";

    if (!s3Access || !s3Secret) return { skipped: true, reason: "no-s3-config" };

    const serviceClient = getBlobServiceClient();
    const containerClient = serviceClient.getContainerClient(container);
    // Note: The shim returns getBlockBlobClient
    const blobClient = containerClient.getBlockBlobClient(key);

    const delRes = await blobClient.deleteIfExists();
    if (!delRes.succeeded) {
      return { skipped: true, reason: "not-found-or-failed" };
    }
    return { deleted: true };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}
