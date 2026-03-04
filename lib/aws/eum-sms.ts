import {
  PinpointSMSVoiceV2Client,
  SendTextMessageCommand,
  SendTextMessageCommandInput,
} from "@aws-sdk/client-pinpoint-sms-voice-v2";

export type SendSmsOptions = {
  to: string | string[]; // E.164 numbers, e.g. +15551234567
  body: string;
  originationNumber?: string; // E.164
  senderId?: string;
  teamEumIdentity?: string; // Add exact identity string for multi-tenant isolation
  messageType?: "PROMOTIONAL" | "TRANSACTIONAL"; // default TRANSACTIONAL
};

function getEnv(name: string, required = false): string | undefined {
  const v = process.env[name];
  if (required && (!v || !String(v).trim())) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v?.trim();
}

let _client: PinpointSMSVoiceV2Client | null = null;
function client(): PinpointSMSVoiceV2Client {
  if (_client) return _client;
  // Fallbacks similar to Pinpoint configuration
  const region =
    getEnv("PINPOINT_REGION") || getEnv("AWS_REGION") || "us-east-1";
  _client = new PinpointSMSVoiceV2Client({ region });
  return _client;
}

export async function sendSmsEum(
  opts: SendSmsOptions,
): Promise<{
  results: Record<string, { messageId?: string; status?: string }>;
}> {
  // PinpointSMSVoiceV2 only supports sending to one destination per call (SendTextMessageCommand).
  const toList = Array.isArray(opts.to)
    ? opts.to.filter(Boolean)
    : [opts.to].filter(Boolean);
  if (toList.length === 0)
    throw new Error("sendSmsEum requires at least one destination number");

  const originationNumber =
    opts.originationNumber ||
    getEnv("PINPOINT_SMS_ORIGINATION_NUMBER") ||
    undefined;
  const senderId =
    opts.senderId || getEnv("PINPOINT_SMS_SENDER_ID") || undefined;

  // EUM uses an "OriginationIdentity" which can be a Phone Number, Sender ID, or Pool ID
  // Look for tenant override FIRST to maintain multi-tenant compliance, then fallback to system values
  const originationIdentity =
    opts.teamEumIdentity ||
    originationNumber ||
    senderId ||
    getEnv("AWS_EUM_ORIGINATION_IDENTITY");

  if (!originationIdentity) {
    throw new Error(
      "Missing OriginationIdentity for AWS EUM. No tenant overrides or system defaults found.",
    );
  }

  const messageType = opts.messageType || "TRANSACTIONAL";
  const out: Record<string, { messageId?: string; status?: string }> = {};

  for (const destinationNumber of toList) {
    const params: SendTextMessageCommandInput = {
      DestinationPhoneNumber: destinationNumber,
      MessageBody: opts.body,
      MessageType: messageType,
      OriginationIdentity: originationIdentity,
    };

    const cmd = new SendTextMessageCommand(params);

    try {
      const res = await client().send(cmd);
      out[destinationNumber] = {
        messageId: res.MessageId,
        status: "SUCCESS",
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      out[destinationNumber] = { status: `FAILED: ${msg}` };
      // If we are sending a single message and it fails, returning error throws upwards
      if (toList.length === 1) {
        throw new Error(`[AWS_EUM_SMS_FAILED] ${msg}`);
      }
    }
  }

  return { results: out };
}
