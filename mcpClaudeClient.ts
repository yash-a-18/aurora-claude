import axios from 'axios';
import 'dotenv/config';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;
if (!CLAUDE_API_KEY) {
	throw new Error('CLAUDE_API_KEY is not set in environment variables');
}
const CLAUDE_MODEL = process.env.CLAUDE_MODEL!;

const claudeApiUrl = 'https://api.anthropic.com/v1/messages';

// VS Code command mappings
const VSCODE_COMMANDS = {
	'aurora': 'AuroraSjsExt.aurora',
	'hello_aurora': 'AuroraSjsExt.aurora',
	'patients': 'AuroraSjsExt.patients',
	'patient_tracker': 'AuroraSjsExt.patients',
	'billing': 'AuroraSjsExt.billing',
	'process_dsl': 'AuroraSjsExt.processDSL',
	'merge_pcms': 'AuroraSjsExt.processDSL',
	'toggle_diagram': 'AuroraSjsExt.toggleDiagramLayout',
	'toggle_diagram_layout': 'AuroraSjsExt.toggleDiagramLayout',
	'change_narrative_type': 'AuroraSjsExt.changeNarrativeType',
	'hide_narratives': 'AuroraSjsExt.hideNarratives',
	'hide_named_groups': 'AuroraSjsExt.hideNamedGroups'
};

export interface McpResponse {
	action: string;
	payload?: any;
	command?: string;
	args?: any[];
}

export async function getMcpFromPrompt(prompt: string): Promise<McpResponse | null> {
	try {
		const response = await axios.post(
			claudeApiUrl,
			{
				model: CLAUDE_MODEL,
				max_tokens: 1500,
				temperature: 0,
				system: `You are Aurora Assistant, a JSON-only design agent for medical software.

				Your job is to convert a user's request into a valid MCP (Model Context Protocol) command.

				IMPORTANT: Only respond in raw JSON (no markdown, no comments, no explanations).

				You can handle two types of actions:

				1. NARRATIVE INSERTION - For adding medical text/narratives:
				{
					"action": "insert_narrative",
					"payload": {
						"type": "[one of: normal, urgent, draft, urgent completed, draft completed]",
						"text": "[clear medical instruction or narrative]",
						"line_number": [integer, e.g. 0]
					}
				}

				2. VSCODE COMMAND EXECUTION - For running VS Code commands:
				{
					"action": "execute_vscode_command",
					"command": "[VS Code command ID]",
					"args": [optional array of arguments]
				}

				Available VS Code commands:
				- AuroraSjsExt.aurora (Hello Aurora)
				- AuroraSjsExt.patients (Patient Tracker)  
				- AuroraSjsExt.billing (Billing)
				- AuroraSjsExt.processDSL (Merge PCMs)
				- AuroraSjsExt.toggleDiagramLayout (Toggle Diagram Layout)
				- AuroraSjsExt.changeNarrativeType (Change Narrative Type)
				- AuroraSjsExt.hideNarratives (Hide Narratives)
				- AuroraSjsExt.hideNamedGroups (Hide Named Groups)

				Examples:
				- "open patient tracker" → {"action": "execute_vscode_command", "command": "AuroraSjsExt.patients"}
				- "add urgent note: check vitals" → {"action": "insert_narrative", "payload": {"type": "urgent", "text": "check vitals", "line_number": 0}}
				- "toggle diagram layout" → {"action": "execute_vscode_command", "command": "AuroraSjsExt.toggleDiagramLayout"}

				Analyze the user's intent and choose the appropriate action type.`,
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
		const parsedResponse = JSON.parse(content);

		// Validate and normalize the response
		return validateAndNormalizeMcpResponse(parsedResponse);
	} catch (err) {
		console.error('Error contacting Claude:', err);
		return null;
	}
}

function validateAndNormalizeMcpResponse(response: any): McpResponse | null {
	if (!response || typeof response !== 'object') {
		console.error('Invalid response format');
		return null;
	}

	const { action, payload, command, args } = response;

	switch (action) {
		case 'insert_narrative':
			if (!payload || !payload.text || !payload.type) {
				console.error('Invalid narrative insertion payload');
				return null;
			}
			return {
				action: 'insert_narrative',
				payload: {
					type: payload.type,
					text: payload.text,
					line_number: payload.line_number || 0
				}
			};

		case 'execute_vscode_command':
			if (!command) {
				console.error('No command specified for VS Code execution');
				return null;
			}

			// Validate command exists
			const validCommands = Object.values(VSCODE_COMMANDS);
			if (!validCommands.includes(command)) {
				console.error(`Invalid VS Code command: ${command}`);
				return null;
			}

			return {
				action: 'execute_vscode_command',
				command,
				args: args || []
			};

		default:
			console.error(`Unknown action: ${action}`);
			return null;
	}
}