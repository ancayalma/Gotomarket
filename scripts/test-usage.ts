import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { getAiSdkModel } from '../lib/varuni';

async function main() {
    const { model } = await getAiSdkModel('system', 'general');
    
    console.log("Testing generateText...");
    const txtRes = await generateText({
        model,
        prompt: "Say hello",
    });
    console.log("generateText usage:", txtRes.usage);

    console.log("Testing generateObject...");
    const objRes = await generateObject({
        model,
        schema: z.object({ msg: z.string() }),
        prompt: "Say hello",
    });
    console.log("generateObject usage:", objRes.usage);
}

main().catch(console.error);
