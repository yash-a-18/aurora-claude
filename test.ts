import axios from 'axios';
import { getMcpFromPrompt } from './mcpClaudeClient';

(async () => {
  const mcp = await getMcpFromPrompt("Add a regular narrative to monitor temperature hourly on line 15.");
  console.log('🧠 Claude MCP Output:', mcp);
  // await axios.post('http://localhost:3001/mcp', mcp); // Run only when mcpServer is running and your extension is connected
})();

