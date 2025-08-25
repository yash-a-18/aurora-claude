import axios from 'axios';
import { getMcpFromPrompt } from './mcpClaudeClient';

(async () => {
  const mcp = await getMcpFromPrompt("Hey, show all patients");
  console.log('🧠 Claude MCP Output:', mcp);
  await axios.post('http://localhost:3001/mcp', mcp); // Run only when mcpServer is running and your extension is connected
})();

