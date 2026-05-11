import { useState, useEffect, useRef } from 'react';
import { generateRoomId } from '../utils/roomId';

const CHUNK_SIZE = 16384;
const HIGH_WATER_MARK = 5 * 1024 * 1024;
const LOW_WATER_MARK = 1 * 1024 * 1024;

const now = () => performance.now();

export type TransferStatus =
	| 'idle'
	| 'waiting-for-peer'
	| 'connecting'
	| 'sending'
	| 'receiving'
	| 'completed'
	| 'cancelled'
	| 'peer-cancelled';

export type CompletedFile = {
	url: string;
	info: { name: string; size: number };
	direction: 'sent' | 'received';
};

export const useFileTransfer = (
	roomId: string | null,
	onRoomIdChange?: (newRoomId: string) => void,
) => {
	const [status, setStatus] = useState<TransferStatus>('idle');
	const [sendProg, setSendProg] = useState(0);
	const [recvProg, setRecvProg] = useState(0);
	const [sendMax, setSendMax] = useState(0);
	const [recvMax, setRecvMax] = useState(0);
	const [sendSpeed, setSendSpeed] = useState(0);
	const [recvSpeed, setRecvSpeed] = useState(0);
	const [sendETA, setSendETA] = useState<number | null>(null);
	const [recvETA, setRecvETA] = useState<number | null>(null);
	const [totalFiles, setTotalFiles] = useState(0);
	const [lastDirection, setLastDirection] = useState<
		'send' | 'receive' | null
	>(null);
	const [receivedFiles, setReceivedFiles] = useState<CompletedFile[]>([]);
	const receivedFilesRef = useRef<CompletedFile[]>([]);

	const pc = useRef<RTCPeerConnection | null>(null);
	const dataChannel = useRef<RTCDataChannel | null>(null);
	const fileReader = useRef<FileReader | null>(null);
	const socket = useRef<WebSocket | null>(null);

	const recvBuffer = useRef<ArrayBuffer[]>([]);
	const recvSize = useRef(0);
	const incomingFileInfo = useRef<{ name: string; size: number } | null>(
		null,
	);

	const sendStartTime = useRef<number | null>(null);
	const recvStartTime = useRef<number | null>(null);

	const sendProgRef = useRef(0);
	const recvProgRef = useRef(0);
	const sendMaxRef = useRef(0);
	const recvMaxRef = useRef(0);

	const isTransferring = useRef(false);
	const isPCOfferer = useRef(false);

	const currentFile = useRef<File | null>(null);
	const offset = useRef(0);

	const roomIdRef = useRef(roomId);
	const queueRef = useRef<File[]>([]);
	const sentCountRef = useRef(0);
	const expectedSendCountRef = useRef(0);

	useEffect(() => {
		roomIdRef.current = roomId;
	}, [roomId]);

	useEffect(() => {
		sendProgRef.current = sendProg;
		recvProgRef.current = recvProg;
		sendMaxRef.current = sendMax;
		recvMaxRef.current = recvMax;
	}, [sendProg, recvProg, sendMax, recvMax]);

	const cleanupConnection = () => {
		if (fileReader.current) {
			fileReader.current.abort();
			fileReader.current.onload = null;
			fileReader.current.onerror = null;
			fileReader.current = null;
		}
		if (dataChannel.current) {
			dataChannel.current.onbufferedamountlow = null;
			dataChannel.current.onmessage = null;
			dataChannel.current.onerror = null;
			dataChannel.current.onopen = null;
			dataChannel.current.close();
			dataChannel.current = null;
		}
		if (pc.current) {
			pc.current.onicecandidate = null;
			pc.current.ondatachannel = null;
			pc.current.close();
			pc.current = null;
		}
	};

	const resetStats = () => {
		setSendProg(0);
		setRecvProg(0);
		setSendMax(0);
		setRecvMax(0);
		setSendSpeed(0);
		setRecvSpeed(0);
		setSendETA(null);
		setRecvETA(null);

		queueRef.current = [];
		setTotalFiles(0);
		sendProgRef.current = 0;
		recvProgRef.current = 0;
		sendMaxRef.current = 0;
		recvMaxRef.current = 0;
		sendStartTime.current = null;
		recvStartTime.current = null;
		isTransferring.current = false;
		sentCountRef.current = 0;
		expectedSendCountRef.current = 0;

		currentFile.current = null;
		offset.current = 0;
		incomingFileInfo.current = null;
		recvBuffer.current = [];
		recvSize.current = 0;
		setLastDirection(null);
	};

	const addReceivedFile = (file: CompletedFile) => {
		receivedFilesRef.current = [...receivedFilesRef.current, file];
		setReceivedFiles([...receivedFilesRef.current]);
	};

	const processQueue = () => {
		if (queueRef.current.length > 0 && !isTransferring.current) {
			const nextFile = queueRef.current.shift();
			if (nextFile) {
				startSendFile(nextFile);
			}
			return;
		}

		if (!isTransferring.current && queueRef.current.length === 0) {
			setStatus('completed');
			sendStartTime.current = null;
			recvStartTime.current = null;
			setSendSpeed(0);
			setRecvSpeed(0);
			setSendETA(null);
			setRecvETA(null);
		}
	};

	const onReceiveMessage = (event: MessageEvent) => {
		if (typeof event.data === 'string') {
			const data = JSON.parse(event.data);

			if (data.type === 'metadata') {
				isTransferring.current = true;
				recvBuffer.current = [];
				recvSize.current = 0;
				setRecvProg(0);
				setRecvSpeed(0);
				setRecvETA(null);
				recvStartTime.current = now();

				incomingFileInfo.current = { name: data.name, size: data.size };
				setRecvMax(data.size);
				recvMaxRef.current = data.size;
				setStatus('receiving');
				setLastDirection('receive');
				return;
			}

			if (data.type === 'batch-end') {
				isTransferring.current = false;
				recvStartTime.current = null;
				setRecvSpeed(0);
				setRecvETA(null);

				if (incomingFileInfo.current && recvSize.current > 0) {
					const blob = new Blob(recvBuffer.current);
					recvBuffer.current = [];
					recvSize.current = 0;
					const url = URL.createObjectURL(blob);
					const fileInfo = incomingFileInfo.current;
					incomingFileInfo.current = null;

					addReceivedFile({
						url,
						info: fileInfo,
						direction: 'received',
					});
				}

				setTimeout(processQueue, 0);
				return;
			}
		}

		if (!recvStartTime.current) {
			recvStartTime.current = now();
		}

		recvBuffer.current.push(event.data as ArrayBuffer);
		recvSize.current += (event.data as ArrayBuffer).byteLength;
		setRecvProg(recvSize.current);
	};

	const readSlice = () => {
		const file = currentFile.current;
		if (!file || !fileReader.current || fileReader.current.readyState === 1)
			return;
		if (offset.current >= file.size) return;

		const slice = file.slice(offset.current, offset.current + CHUNK_SIZE);
		fileReader.current.readAsArrayBuffer(slice);
	};

	const startSendFile = (file: File) => {
		currentFile.current = file;
		offset.current = 0;
		setSendProg(0);
		setSendMax(file.size);
		sendMaxRef.current = file.size;
		setSendSpeed(0);
		setSendETA(null);
		sendStartTime.current = now();
		isTransferring.current = true;
		setStatus('sending');
		setLastDirection('send');

		if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
			console.error('Channel not ready');
			return;
		}

		dataChannel.current.send(
			JSON.stringify({
				type: 'metadata',
				name: file.webkitRelativePath || file.name,
				size: file.size,
			}),
		);

		fileReader.current = new FileReader();
		fileReader.current.onload = (e) => {
			const result = e.target?.result;
			if (!result || !dataChannel.current) return;

			dataChannel.current.send(result as ArrayBuffer);
			offset.current += (result as ArrayBuffer).byteLength;
			setSendProg(offset.current);
			sendProgRef.current = offset.current;

			if (offset.current < file.size) {
				if (dataChannel.current.bufferedAmount <= HIGH_WATER_MARK) {
					readSlice();
				}
			} else {
				dataChannel.current.send(JSON.stringify({ type: 'batch-end' }));
				isTransferring.current = false;
				sendStartTime.current = null;
				setSendSpeed(0);
				setSendETA(null);
				sentCountRef.current += 1;

				processQueue();
			}
		};
		fileReader.current.onerror = console.error;
		readSlice();
	};

	const setupChannel = (channel: RTCDataChannel) => {
		dataChannel.current = channel;
		channel.binaryType = 'arraybuffer';
		channel.bufferedAmountLowThreshold = LOW_WATER_MARK;

		channel.onbufferedamountlow = () => {
			if (
				isTransferring.current &&
				currentFile.current &&
				offset.current < currentFile.current.size
			) {
				readSlice();
			}
		};

		channel.onopen = () => {
			setStatus('idle');
			if (queueRef.current.length > 0 && !isTransferring.current) {
				const next = queueRef.current.shift();
				if (next) startSendFile(next);
			}
		};

		channel.onmessage = onReceiveMessage;

		channel.onerror = (e) => {
			if (
				(e as RTCErrorEvent).error?.message?.includes(
					'User-Initiated Abort',
				)
			)
				return;
			console.error(e);
		};
	};

	const establishConnection = async (offerer: boolean) => {
		isPCOfferer.current = offerer;
		cleanupConnection();
		setStatus('connecting');
		pc.current = new RTCPeerConnection({
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		});

		pc.current.onicecandidate = (event) => {
			if (event.candidate) {
				socket.current?.send(
					JSON.stringify({
						type: 'candidate',
						candidate: event.candidate,
					}),
				);
			}
		};

		if (offerer) {
			const channel = pc.current.createDataChannel('fileTransfer');
			setupChannel(channel);
			const offer = await pc.current.createOffer();
			await pc.current.setLocalDescription(offer);
			socket.current?.send(JSON.stringify({ type: 'offer', offer }));
		} else {
			pc.current.ondatachannel = (event) => {
				setupChannel(event.channel);
			};
		}
	};

	useEffect(() => {
		socket.current = new WebSocket('ws://localhost:3000');

		socket.current.onopen = () => {
			if (roomIdRef.current) {
				socket.current?.send(
					JSON.stringify({ type: 'join', room: roomIdRef.current }),
				);
			}
		};

		socket.current.onmessage = async (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'peer-joined') {
				if (isPCOfferer.current) {
					await establishConnection(true);
				}
				return;
			}

			if (data.type === 'leave') {
				cleanupConnection();
				setStatus('peer-cancelled');
				return;
			}

			if (data.type === 'signal-abort') {
				cleanupConnection();
				resetStats();
				setStatus('peer-cancelled');
				return;
			}

			if (data.type === 'offer') {
				isPCOfferer.current = false;
				await establishConnection(false);
				await pc.current?.setRemoteDescription(data.offer);
				const answer = await pc.current!.createAnswer();
				await pc.current!.setLocalDescription(answer);
				socket.current?.send(
					JSON.stringify({ type: 'answer', answer }),
				);
			}

			if (data.type === 'answer') {
				await pc.current?.setRemoteDescription(data.answer);
			}

			if (data.type === 'candidate') {
				if (pc.current?.remoteDescription) {
					await pc.current.addIceCandidate(data.candidate);
				} else {
					setTimeout(
						() => pc.current?.addIceCandidate(data.candidate),
						100,
					);
				}
			}
			if (data.type === 'room-full') {
				const newId = generateRoomId();
				socket.current?.send(
					JSON.stringify({ type: 'join', room: newId }),
				);
				onRoomIdChange?.(newId);
				return;
			}
		};

		return () => {
			socket.current?.close();
			cleanupConnection();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			if (sendStartTime.current && sendProgRef.current > 0) {
				const elapsed =
					(performance.now() - sendStartTime.current) / 1000;
				const speed = sendProgRef.current / elapsed;
				setSendSpeed(speed);
				if (sendMaxRef.current > 0 && speed > 0) {
					setSendETA(
						(sendMaxRef.current - sendProgRef.current) / speed,
					);
				}
			}

			if (recvStartTime.current && recvProgRef.current > 0) {
				const elapsed =
					(performance.now() - recvStartTime.current) / 1000;
				const speed = recvProgRef.current / elapsed;
				setRecvSpeed(speed);
				if (recvMaxRef.current > 0 && speed > 0) {
					setRecvETA(
						(recvMaxRef.current - recvProgRef.current) / speed,
					);
				}
			}
		}, 500);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (roomId && socket.current?.readyState === WebSocket.OPEN) {
			socket.current.send(JSON.stringify({ type: 'join', room: roomId }));
		}
	}, [roomId]);

	const startSend = (files: File[], targetRoomId: string) => {
		if (files.length === 0) return;

		const [firstFile, ...rest] = files;
		queueRef.current = rest;
		setTotalFiles(files.length);
		expectedSendCountRef.current = files.length;
		sentCountRef.current = 0;

		const needsConnection =
			!pc.current ||
			pc.current.connectionState === 'closed' ||
			!dataChannel.current;

		if (needsConnection) {
			isPCOfferer.current = true;

			if (socket.current?.readyState === WebSocket.OPEN) {
				socket.current.send(
					JSON.stringify({ type: 'join', room: targetRoomId }),
				);
			}
			setStatus('waiting-for-peer');
			queueRef.current.unshift(firstFile);
		} else {
			if (!isTransferring.current) {
				startSendFile(firstFile);
			} else {
				queueRef.current.unshift(firstFile);
			}
		}
	};

	const resetTransfer = () => {
		socket.current?.send(JSON.stringify({ type: 'signal-abort' }));
		cleanupConnection();
		resetStats();
		setStatus('cancelled');
	};

	const disconnect = () => {
		if (socket.current?.readyState === WebSocket.OPEN) {
			socket.current.send(JSON.stringify({ type: 'leave' }));
		}
		cleanupConnection();
		resetStats();

		receivedFilesRef.current.forEach((f) => {
			if (f.url) URL.revokeObjectURL(f.url);
		});
		receivedFilesRef.current = [];
		setReceivedFiles([]);

		setStatus('idle');
	};

	const clearStatus = () => {
		resetStats();
		setStatus('idle');
	};

	return {
		status,
		sendProg,
		recvProg,
		sendMax,
		recvMax,
		receivedFiles,
		totalFiles,
		lastDirection,
		startSend,
		resetTransfer,
		clearStatus,
		disconnect,
		sendSpeed,
		recvSpeed,
		sendETA,
		recvETA,
	};
};
