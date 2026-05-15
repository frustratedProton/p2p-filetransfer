import { WebSocketServer, WebSocket } from 'ws';

type SignalingMessage = {
	type: 'join' | 'offer' | 'answer' | 'candidate' | 'leave' | 'signal-abort';
	room?: string;
	offer?: RTCSessionDescriptionInit;
	answer?: RTCSessionDescriptionInit;
	candidate?: RTCIceCandidateInit;
};

const wss = new WebSocketServer({ port: 3000 });

const rooms = new Map<string, Set<WebSocket>>();

function leaveRoom(ws: WebSocket & { roomId?: string }, notify: boolean) {
	const roomId = ws.roomId;
	if (!roomId || !rooms.has(roomId)) return;

	const roomClients = rooms.get(roomId)!;
	roomClients.delete(ws);
	ws.roomId = undefined;

	if (notify) {
		const leaveMsg = JSON.stringify({ type: 'leave' });
		for (const client of roomClients) {
			if (client.readyState === WebSocket.OPEN) {
				client.send(leaveMsg);
			}
		}
	}

	if (roomClients.size === 0) {
		rooms.delete(roomId);
		console.log(`Room ${roomId} emptied and removed`);
	} else {
		console.log(
			`Client left room ${roomId} (Remaining: ${roomClients.size})`,
		);
	}
}

wss.on('connection', (ws: WebSocket & { roomId?: string }) => {
	console.log('client connected');

	ws.on('message', (message: Buffer) => {
		if (message.length > 64 * 1024) {
			ws.send(
				JSON.stringify({ type: 'error', message: 'message too large' }),
			);
			return;
		}

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

			if (ws.roomId && ws.roomId !== roomId) {
				leaveRoom(ws, true);
			}

			if (!rooms.has(roomId)) {
				rooms.set(roomId, new Set());
			}

			if (rooms.get(roomId)!.size >= 2) {
				ws.send(JSON.stringify({ type: 'room-full' }));
				return;
			}

			ws.roomId = roomId;
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

		if (data.type === 'leave') {
			leaveRoom(ws, true);
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
		leaveRoom(ws, true);
	});

	ws.on('error', (error) => {
		console.error('WebSocket error:', error);
	});
});

console.log('Signaling server running on ws://localhost:3000');
