import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

let activeSocket: WebSocket | null = null;

// Handle WebSocket connections from VS Code extension
wss.on('connection', (ws) => {
  console.log('✅ VS Code connected via WebSocket');
  activeSocket = ws;

  ws.on('close', () => {
    console.log('❌ VS Code disconnected');
    activeSocket = null;
  });
});

// Endpoint to accept MCP JSON (from Claude)
app.post('/mcp', (req, res) => {
  const mcp = req.body;

  if (!mcp || !activeSocket) {
    return res.status(400).json({ error: 'No active socket or invalid payload' });
  }

  console.log('📩 Received MCP:', JSON.stringify(mcp, null, 2));
  activeSocket.send(JSON.stringify(mcp));

  res.status(200).json({ status: 'OK' });
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 MCP Server listening at http://localhost:${PORT}`);
});
