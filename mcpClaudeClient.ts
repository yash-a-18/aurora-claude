import axios from 'axios';
import 'dotenv/config';


const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;
if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is not set in environment variables');
}
const CLAUDE_MODEL = process.env.CLAUDE_MODEL!;

const claudeApiUrl = 'https://api.anthropic.com/v1/messages';

export async function getMcpFromPrompt(prompt: string): Promise<any> {
    try {
        const response = await axios.post(
            claudeApiUrl,
            {
                model: CLAUDE_MODEL,
                max_tokens: 1000,
                temperature: 0,
                system: `You are Aurora Assistant, a JSON-only design agent.

                    Your job is to convert a user's request into a valid MCP (Model Context Protocol) command.

                    - Only respond in raw JSON (no markdown, no comments, no explanations).
                    - Only include keys that match this format:
                    {
                        "action": "insert_narrative",
                        "payload": {
                        "type": "[one of: normal, urgent, draft, urgent completed, draft completed]",
                        "text": "[clear medical instruction or narrative]",
                        "line_number": [integer, e.g. 0]
                        }
                    }`,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    'x-api-key': CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'Content-type': 'application/json'
                }
            }
        );

        const content = response.data?.content?.[0]?.text || '{}';
        return JSON.parse(content);
    } catch (err) {
        console.error('Error contacting Claude:', err);
        return null;
    }
}
