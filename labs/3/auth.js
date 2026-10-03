import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Get raw response with headers
const { data, rawResponse } = await client.textToSpeech
  .convert('21m00Tcm4TlvDq8ikWAM', {
    text: 'Hello, world!',
    modelId: 'eleven_v3',
  })
  .withRawResponse();

// Access character cost from headers
const charCost = rawResponse.headers.get('character-cost');

// Optionally store these for debugging
const requestId = rawResponse.headers.get('request-id');
const traceId = rawResponse.headers.get('x-trace-id');

const audioData = data;

console.log(rawResponse);