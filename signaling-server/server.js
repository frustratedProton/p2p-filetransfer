import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 3000 });

let clients = new Set();

wss.on('connection', (ws) => {
	clients.add(ws);

	ws.on('message', (message) => {
		for (const client of clients) {
			if (client !== ws && client.readyState === 1) {
				client.send(message.toString());
			}
		}
	});

	ws.on('close', () => {
		clients.delete(ws);
	});
});

console.log('Signaling server running on ws://localhost:3000');
