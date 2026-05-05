import { WebSocketServer, WebSocket } from 'ws';

type SignalingMessage = {
	type: 'join' | 'offer' | 'answer' | 'candidate';
	room?: string;
	offer?: RTCSessionDescriptionInit;
	answer?: RTCSessionDescriptionInit;
	candidate?: RTCIceCandidateInit;
};

const wss = new WebSocketServer({ port: 3000 });

const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket & { roomId?: string }) => {
	console.log('client connected');

	ws.on('message', (message: Buffer) => {
		let data: SignalingMessage;
		try {
			data = JSON.parse(message.toString());
		} catch (err) {
			console.error(err);
			return;
		}

		if (data.type === 'join') {
			const roomId = data.room;
			if (!roomId || typeof roomId !== 'string') {
				ws.send(JSON.stringify({ error: 'Invalid room ID' }));
				return;
			}

			ws.roomId = roomId;

			if (!rooms.has(roomId)) {
				rooms.set(roomId, new Set());
			}
			rooms.get(roomId)!.add(ws);

			const joinMsg = JSON.stringify({ type: 'peer-joined' });
			for (const client of rooms.get(roomId)!) {
				if (client !== ws && client.readyState === WebSocket.OPEN) {
					client.send(joinMsg);
				}
			}

			console.log(
				`client joined room: ${roomId} (Total: ${rooms.get(roomId)!.size})`,
			);
			return;
		}

		if (!ws.roomId || !rooms.has(ws.roomId)) {
			console.log('Message ignored: client not in room');
			return;
		}

		const roomClients = rooms.get(ws.roomId)!;
		const msgStr = message.toString();
		for (const client of roomClients) {
			if (client !== ws && client.readyState === WebSocket.OPEN) {
				client.send(msgStr);
			}
		}
	});

	ws.on('close', () => {
		console.log('client disconnected');
		if (ws.roomId && rooms.has(ws.roomId)) {
			const roomClients = rooms.get(ws.roomId)!;
			roomClients?.delete(ws);

			const leaveMsg = JSON.stringify({ type: 'leave' });
			for (const client of roomClients) {
				if (client.readyState === WebSocket.OPEN) {
					client.send(leaveMsg);
				}
			}

			if (roomClients.size === 0) {
				rooms.delete(ws.roomId);
				console.log(`Room ${ws.roomId} emptied and removed`);
			}
		}
	});

	ws.on('error', (error) => {
		console.error('WebSocket error:', error);
	});
});

console.log('Singaling server running on ws://localhost:3000');
