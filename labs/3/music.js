import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
async function main() {
    const client = new ElevenLabsClient({
        apiKey: "xi-api-key",
    });
    await client.music.composeDetailed({
        prompt: "A prompt for music generation",
        musicLengthMs: 10000,
    });
}
main();