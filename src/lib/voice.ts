/**
 * Voice / video architecture prep for LiveKit.
 *
 * LiveKit is NOT wired yet — no credentials exist for a LiveKit Cloud project.
 * Once a project exists, the plan is:
 *
 *   1. Add `@livekit/components-react` + `livekit-client` (or `@livekit/server-sdk`
 *      server side) as dependencies.
 *   2. Generate LiveKit access tokens from a Convex action backed by
 *      `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` env vars, issued per voice
 *      channel join (`voice` channels already exist in the schema).
 *   3. Add a `voiceStates` table (userId, channelId, micMuted, deafened) and
 *      subscribe to it for live voice-channel member lists.
 *   4. Replace the `joinVoiceRoom` stub below with a real `Room` connection.
 *
 * Nothing here claims to work yet — see README "Voice & Video".
 */

export type VoiceState = {
  channelId: string;
  connected: boolean;
  micMuted: boolean;
  deafened: boolean;
};

export type LiveKitConfig = {
  serverUrl: string;
  token: string;
};

export async function joinVoiceRoom(
  _channelId: string,
  _config?: LiveKitConfig,
): Promise<VoiceState> {
  throw new Error(
    "Voice is not wired up yet. A LiveKit project (server URL + API keys) is required.",
  );
}

export async function leaveVoiceRoom(): Promise<void> {
  throw new Error("Voice is not wired up yet.");
}
