"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var client_chime_sdk_meetings_1 = require("@aws-sdk/client-chime-sdk-meetings");
var REGION = process.env.CHIME_REGION || process.env.AWS_REGION || "us-west-2";
var MEETING_REGION = process.env.CHIME_APP_MEETING_REGION || REGION;
var chime = new client_chime_sdk_meetings_1.ChimeSDKMeetingsClient({ region: REGION });
function getEnv(name, required) {
    if (required === void 0) { required = false; }
    var v = process.env[name];
    if (required && (!v || !String(v).trim()))
        throw new Error("Missing env var: ".concat(name));
    return v === null || v === void 0 ? void 0 : v.toString().trim();
}
/**
 * SIP Media Application Lambda handler (prototype)
 * Note: SMA events include InvocationEventType values like NEW_INBOUND_CALL, ACTION_SUCCESS, DIGIT_COLLECTION, etc.
 * We return { SchemaVersion: "1.0", Actions: [...] } with actions such as Speak, CallAndBridge, PlayAudio, Hangup.
 * Adjust actions to match your SMA feature set/region.
 */
var handler = function (event) { return __awaiter(void 0, void 0, void 0, function () {
    var type, meetingRes, meeting, speak, bridgeUri, callerId, actions, e_1, participants, legA, rawHeaders_1, attrs_1, getVal_1, fetchAny, elevenLabsAgentId, callerId_1, meetingId, attendeeId, joinToken, bridgeUri, callerId, actions, participants, legA, rawHeaders_2, attrs_2, getVal_2, fetchAny, meetingId, joinToken, last;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return __generator(this, function (_r) {
        switch (_r.label) {
            case 0:
                console.log("[SMA_EVENT]", JSON.stringify(event));
                type = event === null || event === void 0 ? void 0 : event.InvocationEventType;
                if (!(type === "NEW_INBOUND_CALL")) return [3 /*break*/, 5];
                _r.label = 1;
            case 1:
                _r.trys.push([1, 4, , 5]);
                return [4 /*yield*/, chime.send(new client_chime_sdk_meetings_1.CreateMeetingCommand({
                        ClientRequestToken: "".concat(Date.now(), "_").concat(Math.floor(Math.random() * 1e9)),
                        MediaRegion: MEETING_REGION,
                        ExternalMeetingId: "sma-".concat(Date.now()),
                    }))];
            case 2:
                meetingRes = _r.sent();
                meeting = meetingRes.Meeting;
                if (!(meeting === null || meeting === void 0 ? void 0 : meeting.MeetingId)) {
                    return [2 /*return*/, { SchemaVersion: "1.0", Actions: [{ Type: "Hangup" }] }];
                }
                // Create a dummy attendee for server-side correlation (optional)
                return [4 /*yield*/, chime.send(new client_chime_sdk_meetings_1.CreateAttendeeCommand({
                        MeetingId: meeting.MeetingId,
                        ExternalUserId: "sma-".concat(Math.floor(Math.random() * 1e9)),
                    }))];
            case 3:
                // Create a dummy attendee for server-side correlation (optional)
                _r.sent();
                speak = {
                    Type: "Speak",
                    Parameters: {
                        Text: "Welcome. Please hold while we connect your call.",
                        Engine: "neural",
                        LanguageCode: "en-US",
                        VoiceId: "Joanna",
                    },
                };
                bridgeUri = getEnv("CHIME_BRIDGE_ENDPOINT_URI");
                callerId = getEnv("CHIME_SOURCE_PHONE") || getEnv("CHIME_SMA_PHONE_NUMBER");
                actions = bridgeUri
                    ? [
                        speak,
                        {
                            Type: "CallAndBridge",
                            Parameters: {
                                Endpoints: [{ Uri: bridgeUri }],
                                CallerIdNumber: callerId,
                                CallTimeoutSeconds: 60,
                            },
                        },
                    ]
                    : [speak];
                return [2 /*return*/, { SchemaVersion: "1.0", Actions: actions }];
            case 4:
                e_1 = _r.sent();
                console.error("[SMA_NEW_INBOUND_ERROR]", e_1);
                return [2 /*return*/, { SchemaVersion: "1.0", Actions: [{ Type: "Hangup" }] }];
            case 5:
                // After an action succeeds, you can continue the flow or hang up.
                if (type === "NEW_OUTBOUND_CALL") {
                    // Attempt to join the PSTN leg to an existing Chime meeting using JoinToken passed via SipHeaders.
                    try {
                        participants = (((_a = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _a === void 0 ? void 0 : _a.Participants) || []);
                        legA = participants.find(function (p) { return (p === null || p === void 0 ? void 0 : p.ParticipantTag) === "LEG-A"; });
                        rawHeaders_1 = (((_b = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _b === void 0 ? void 0 : _b.SipHeaders) || ((_d = (_c = event === null || event === void 0 ? void 0 : event.ActionData) === null || _c === void 0 ? void 0 : _c.Parameters) === null || _d === void 0 ? void 0 : _d.SipHeaders) || ((_e = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _e === void 0 ? void 0 : _e.ReceivedHeaders) || {});
                        attrs_1 = (((_f = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _f === void 0 ? void 0 : _f.Attributes) || {});
                        getVal_1 = function (obj, k) { return (obj === null || obj === void 0 ? void 0 : obj[k]) || (obj === null || obj === void 0 ? void 0 : obj[k.toLowerCase()]) || (obj === null || obj === void 0 ? void 0 : obj[k.toUpperCase()]); };
                        fetchAny = function (k) { return getVal_1(rawHeaders_1, k) || getVal_1(attrs_1, k); };
                        elevenLabsAgentId = fetchAny("X-Elevenlabs-Agent-Id") || fetchAny("X_ELEVENLABS_AGENT_ID") || fetchAny("x-elevenlabs-agent-id");
                        callerId_1 = getEnv("CHIME_SOURCE_PHONE") || getEnv("CHIME_SMA_PHONE_NUMBER");
                        if (elevenLabsAgentId && legA) {
                            console.log("[SMA_ELEVENLABS_BRIDGE] Routing outbound call directly to ElevenLabs Agent: ".concat(elevenLabsAgentId));
                            return [2 /*return*/, {
                                    SchemaVersion: "1.0",
                                    Actions: [
                                        { Type: "Speak", Parameters: { Text: "Connecting your A.I. assistant.", Engine: "neural", LanguageCode: "en-US", VoiceId: "Joanna" } },
                                        {
                                            Type: "CallAndBridge",
                                            Parameters: {
                                                Endpoints: [{ Uri: "sip:".concat(elevenLabsAgentId, "@sip.elevenlabs.app") }],
                                                CallerIdNumber: callerId_1,
                                                CallTimeoutSeconds: 60,
                                            },
                                        }
                                    ]
                                }];
                        }
                        meetingId = fetchAny("X-Meeting-Id") || fetchAny("X_MEETING_ID") || fetchAny("x-meeting-id") || fetchAny("MeetingId") || fetchAny("MEETING_ID");
                        attendeeId = fetchAny("X-Attendee-Id") || fetchAny("X_ATTENDEE_ID") || fetchAny("x-attendee-id") || fetchAny("AttendeeId") || fetchAny("ATTENDEE_ID");
                        joinToken = fetchAny("X-Join-Token") || fetchAny("X_JOIN_TOKEN") || fetchAny("x-join-token") || fetchAny("JoinToken") || fetchAny("JOIN_TOKEN");
                        console.log("[SMA_OUTBOUND_HEADERS]", { meetingId: meetingId, attendeeId: attendeeId, hasJoinToken: !!joinToken, legACallId: legA === null || legA === void 0 ? void 0 : legA.CallId, hasAttrs: !!attrs_1 && Object.keys(attrs_1 || {}).length > 0 });
                        if (meetingId && joinToken && (legA === null || legA === void 0 ? void 0 : legA.CallId)) {
                            // Directly join the outbound PSTN leg (LEG-A) to the specified Chime meeting
                            return [2 /*return*/, {
                                    SchemaVersion: "1.0",
                                    Actions: [
                                        {
                                            Type: "JoinChimeMeeting",
                                            Parameters: {
                                                CallId: legA.CallId,
                                                JoinToken: joinToken,
                                                MeetingId: meetingId,
                                            },
                                        },
                                    ],
                                }];
                        }
                    }
                    catch (e) {
                        console.error("[SMA_NEW_OUTBOUND_PARSE_HEADERS_ERROR]", e);
                    }
                    bridgeUri = getEnv("CHIME_BRIDGE_ENDPOINT_URI");
                    callerId = getEnv("CHIME_SOURCE_PHONE") || getEnv("CHIME_SMA_PHONE_NUMBER");
                    actions = bridgeUri
                        ? [{
                                Type: "CallAndBridge",
                                Parameters: {
                                    Endpoints: [{ Uri: bridgeUri }],
                                    CallerIdNumber: callerId,
                                    CallTimeoutSeconds: 60,
                                },
                            }]
                        : [{ Type: "Speak", Parameters: { Text: "Connecting your call.", Engine: "neural", LanguageCode: "en-US", VoiceId: "Joanna" } }];
                    return [2 /*return*/, { SchemaVersion: "1.0", Actions: actions }];
                }
                if (type === "CALL_ANSWERED") {
                    try {
                        participants = (((_g = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _g === void 0 ? void 0 : _g.Participants) || []);
                        legA = participants.find(function (p) { return (p === null || p === void 0 ? void 0 : p.ParticipantTag) === "LEG-A"; }) || participants[0];
                        rawHeaders_2 = (((_h = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _h === void 0 ? void 0 : _h.SipHeaders) || ((_k = (_j = event === null || event === void 0 ? void 0 : event.ActionData) === null || _j === void 0 ? void 0 : _j.Parameters) === null || _k === void 0 ? void 0 : _k.SipHeaders) || ((_l = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _l === void 0 ? void 0 : _l.ReceivedHeaders) || {});
                        attrs_2 = (((_m = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _m === void 0 ? void 0 : _m.Attributes) || {});
                        getVal_2 = function (obj, k) { return (obj === null || obj === void 0 ? void 0 : obj[k]) || (obj === null || obj === void 0 ? void 0 : obj[k.toLowerCase()]) || (obj === null || obj === void 0 ? void 0 : obj[k.toUpperCase()]); };
                        fetchAny = function (k) { return getVal_2(rawHeaders_2, k) || getVal_2(attrs_2, k); };
                        meetingId = fetchAny("X-Meeting-Id") || fetchAny("X_MEETING_ID") || fetchAny("x-meeting-id") || fetchAny("MeetingId") || fetchAny("MEETING_ID");
                        joinToken = fetchAny("X-Join-Token") || fetchAny("X_JOIN_TOKEN") || fetchAny("x-join-token") || fetchAny("JoinToken") || fetchAny("JOIN_TOKEN");
                        console.log("[SMA_CALL_ANSWERED]", { meetingId: meetingId, hasJoinToken: !!joinToken, callId: legA === null || legA === void 0 ? void 0 : legA.CallId });
                        if (meetingId && joinToken && (legA === null || legA === void 0 ? void 0 : legA.CallId)) {
                            return [2 /*return*/, {
                                    SchemaVersion: "1.0",
                                    Actions: [
                                        {
                                            Type: "JoinChimeMeeting",
                                            Parameters: {
                                                CallId: legA.CallId,
                                                JoinToken: joinToken,
                                                MeetingId: meetingId,
                                            },
                                        },
                                    ],
                                }];
                        }
                    }
                    catch (e) {
                        console.error("[SMA_CALL_ANSWERED_ERROR]", e);
                    }
                    // No-op to keep call alive if headers not found
                    return [2 /*return*/, { SchemaVersion: "1.0", Actions: [] }];
                }
                if (type === "ACTION_SUCCESS") {
                    last = (_o = event === null || event === void 0 ? void 0 : event.ActionData) === null || _o === void 0 ? void 0 : _o.Type;
                    console.log("[SMA_ACTION_SUCCESS]", {
                        participants: (_p = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _p === void 0 ? void 0 : _p.Participants,
                        lastActionType: last,
                        callId: (_q = event === null || event === void 0 ? void 0 : event.CallDetails) === null || _q === void 0 ? void 0 : _q.CallId,
                    });
                    // If we just joined the Chime meeting, do NOT speak; keep the bridge active with no-op
                    if (String(last) === "JoinChimeMeeting") {
                        return [2 /*return*/, { SchemaVersion: "1.0", Actions: [] }];
                    }
                    // Otherwise, short prompt while other actions complete
                    return [2 /*return*/, { SchemaVersion: "1.0", Actions: [{ Type: "Speak", Parameters: { Text: "Please hold.", Engine: "neural", LanguageCode: "en-US", VoiceId: "Joanna" } }] }];
                }
                // Default: hang up for unsupported events in this prototype
                return [2 /*return*/, { SchemaVersion: "1.0", Actions: [{ Type: "Hangup" }] }];
        }
    });
}); };
exports.handler = handler;
