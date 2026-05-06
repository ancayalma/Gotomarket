import { SESv2Client, CreateEmailIdentityCommand, GetEmailIdentityCommand, DeleteEmailIdentityCommand } from "@aws-sdk/client-sesv2";

interface SESCredentials {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
}

const getClient = (creds?: SESCredentials) => {
    if (creds?.accessKeyId && creds?.secretAccessKey) {
        return new SESv2Client({
            region: creds.region || "us-east-1",
            credentials: {
                accessKeyId: creds.accessKeyId,
                secretAccessKey: creds.secretAccessKey,
            }
        });
    }
    // Fallback to system env
    return new SESv2Client({ region: process.env.SES_REGION || process.env.AWS_REGION || "us-east-1" });
}

export type VerificationStatus = "PENDING" | "SUCCESS" | "FAILED" | "NOT_STARTED";

/**
 * Triggers a verification email to be sent to the specified address.
 * AWS SES will send a link that the user must click.
 */
export async function verifyEmailIdentity(email: string, creds?: SESCredentials, forceResend?: boolean): Promise<boolean> {
    const client = getClient(creds);

    // If forceResend is requested, delete the existing identity first
    // so CreateEmailIdentity actually re-sends the verification email.
    // SES silently no-ops on AlreadyExists — the only way to resend is delete + recreate.
    if (forceResend) {
        try {
            const deleteCmd = new DeleteEmailIdentityCommand({ EmailIdentity: email });
            await client.send(deleteCmd);
            console.log(`[SES_VERIFY] Deleted existing identity for ${email} to force resend.`);
        } catch {
            // Ignore if not found — we'll create fresh
        }
    }

    try {
        const command = new CreateEmailIdentityCommand({
            EmailIdentity: email,
        });
        await client.send(command);
        return true;
    } catch (error: any) {
        // If already exists and we're NOT force-resending, that's fine.
        if (
            error.name === "AlreadyExistsException" ||
            error.Code === "AlreadyExistsException" ||
            error.__type?.includes("AlreadyExistsException") ||
            error.message?.includes("already exist")
        ) {
            console.log(`[SES_VERIFY] Identity ${email} already exists, treating as success.`);
            return true;
        }
        console.error("[SES_VERIFY_INIT]", error);
        throw new Error(`Failed to initiate verification: ${error.message}`);
    }
}

/**
 * Checks the current verification status of an email identity.
 */
export async function getIdentityVerificationStatus(email: string, creds?: SESCredentials): Promise<VerificationStatus> {
    const sesClient = getClient(creds);
    try {
        const command = new GetEmailIdentityCommand({
            EmailIdentity: email,
        });
        const response = await sesClient.send(command);

        // SESv2 returns VerifiedForSendingStatus: boolean
        if (response.VerifiedForSendingStatus) {
            return "SUCCESS";
        }

        // Fallback: check if the parent domain is verified (e.g. basalthq.com covers kpatel@basalthq.com)
        const domain = email.split("@")[1];
        if (domain) {
            try {
                const domainCmd = new GetEmailIdentityCommand({ EmailIdentity: domain });
                const domainRes = await sesClient.send(domainCmd);
                if (domainRes.VerifiedForSendingStatus) {
                    return "SUCCESS";
                }
            } catch {
                // Domain identity doesn't exist — that's fine, email-level verification required
            }
        }

        return "PENDING";
    } catch (error: any) {
        if (error.name === "NotFoundException") {
            // Email identity not found — check if domain covers it
            const domain = email.split("@")[1];
            if (domain) {
                try {
                    const domainCmd = new GetEmailIdentityCommand({ EmailIdentity: domain });
                    const domainRes = await getClient(creds).send(domainCmd);
                    if (domainRes.VerifiedForSendingStatus) {
                        return "SUCCESS";
                    }
                } catch {
                    // Domain not found either
                }
            }
            return "NOT_STARTED";
        }
        console.error("[SES_VERIFY_CHECK]", error);
        return "FAILED";
    }
}

/**
 * Remove an identity (stopped verifying or deleted config)
 */
export async function deleteEmailIdentity(email: string, creds?: SESCredentials) {
    const client = getClient(creds);
    try {
        const command = new DeleteEmailIdentityCommand({
            EmailIdentity: email
        });
        await client.send(command);
    } catch {
        // Ignore if not found
    }
}

/**
 * Triggers domain verification via SES. Returns DKIM tokens for DNS configuration.
 * The domain owner must add CNAME records for DKIM + a TXT record for domain ownership.
 */
export async function verifyDomainIdentity(domain: string, creds?: SESCredentials): Promise<{
    dkimTokens: string[];
    verificationToken?: string;
}> {
    const client = getClient(creds);
    try {
        const command = new CreateEmailIdentityCommand({
            EmailIdentity: domain,
        });
        const response = await client.send(command);

        // SESv2 returns DkimAttributes with signing tokens
        const dkimTokens = response.DkimAttributes?.Tokens || [];

        return {
            dkimTokens,
            // The TXT record for domain verification is: _amazonses.<domain> TXT <token>
            // SESv2 handles this automatically via DKIM, but we return the tokens for reference
            verificationToken: dkimTokens[0] || undefined,
        };
    } catch (error: any) {
        if (error.name === "AlreadyExistsException" || error.Code === "AlreadyExistsException" || error.message?.includes("already exist")) {
            // Domain already registered — fetch existing DKIM tokens
            try {
                const getCmd = new GetEmailIdentityCommand({ EmailIdentity: domain });
                const getRes = await client.send(getCmd);
                const existingTokens = getRes.DkimAttributes?.Tokens || [];
                return { dkimTokens: existingTokens, verificationToken: existingTokens[0] || undefined };
            } catch (getErr) {
                console.error("[SES_DOMAIN_FETCH]", getErr);
                return { dkimTokens: [], verificationToken: undefined };
            }
        }
        console.error("[SES_DOMAIN_VERIFY]", error);
        throw new Error(`Failed to initiate domain verification: ${error.message}`);
    }
}
