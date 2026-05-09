import { useState, useEffect, useRef } from 'react';

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

export const useFileTransfer = (roomId: string | null) => {
	const [status, setStatus] = useState<TransferStatus>('idle');
	const [sendProg, setSendProg] = useState<number>(0);
	const [recvProg, setRecvProg] = useState<number>(0);
	const [sendMax, setSendMax] = useState<number>(0);
	const [recvMax, setRecvMax] = useState<number>(0);
	// const [downloadURL, setDownloadURL] = useState<string | null>(null);
	// const [downloadInfo, setDownloadInfo] = useState<{
	// 	name: string;
	// 	size: number;
	// } | null>(null);
	const [sendSpeed, setSendSpeed] = useState<number>(0);
	const [recvSpeed, setRecvSpeed] = useState<number>(0);
	const [sendETA, setSendETA] = useState<number | null>(null);
	const [recvETA, setRecvETA] = useState<number | null>(null);
	const [completedFiles, setCompletedFiles] = useState<
		Array<{ url: string; info: { name: string; size: number } }>
	>([]);
	const [totalFiles, setTotalFiles] = useState<number>(0);

	const pc = useRef<RTCPeerConnection | null>(null);
	const sendChannel = useRef<RTCDataChannel | null>(null);
	const recvChannel = useRef<RTCDataChannel | null>(null);
	const fileReader = useRef<FileReader | null>(null);
	const socket = useRef<WebSocket | null>(null);

	const recvBuffer = useRef<ArrayBuffer[]>([]);
	const recvSize = useRef<number>(0);
	const incomingFileInfo = useRef<{ name: string; size: number } | null>(
		null,
	);

	const sendStartTime = useRef<number | null>(null);
	const recvStartTime = useRef<number | null>(null);

	const sendProgRef = useRef(0);
	const recvProgRef = useRef(0);
	const sendMaxRef = useRef(0);
	const recvMaxRef = useRef(0);

	const isOfferer = useRef<boolean>(false);
	const currentFile = useRef<File | null>(null);
	const offset = useRef<number>(0);

	const roomIdRef = useRef(roomId);
	const queueRef = useRef<File[]>([]);

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

		if (sendChannel.current) {
			sendChannel.current.onbufferedamountlow = null;
			sendChannel.current.onerror = null;
			sendChannel.current.close();
			sendChannel.current = null;
		}

		if (recvChannel.current) {
			recvChannel.current.onmessage = null;
			recvChannel.current.close();
			recvChannel.current = null;
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
		// setDownloadURL(null);
		// setDownloadInfo(null);
		setSendSpeed(0);
		setRecvSpeed(0);
		setSendETA(null);
		setRecvETA(null);
		setCompletedFiles([]);

		queueRef.current = [];
		setTotalFiles(0);
		sendProgRef.current = 0;
		recvProgRef.current = 0;
		sendMaxRef.current = 0;
		recvMaxRef.current = 0;
		sendStartTime.current = null;
		recvStartTime.current = null;

		currentFile.current = null;
		isOfferer.current = false;
		offset.current = 0;
	};

	const onReceiveMessage = (event: MessageEvent) => {
		if (!recvStartTime.current) {
			recvStartTime.current = performance.now();
		}

		if (typeof event.data === 'string') {
			const data = JSON.parse(event.data);
			if (data.type === 'metadata') {
				recvBuffer.current = [];
				recvSize.current = 0;
				setRecvProg(0);
				setRecvSpeed(0);
				setRecvETA(null);
				recvStartTime.current = performance.now();

				incomingFileInfo.current = data;
				setRecvMax(data.size);
				setStatus('receiving');
				return;
			}
			if (data.type === 'batch-end') {
				setStatus('completed');
				return;
			}
		}

		recvBuffer.current.push(event.data);
		recvSize.current += event.data.byteLength;
		setRecvProg(recvSize.current);

		if (
			incomingFileInfo.current &&
			recvSize.current === incomingFileInfo.current.size
		) {
			const blob = new Blob(recvBuffer.current);
			recvBuffer.current = [];
			recvSize.current = 0;

			const url = URL.createObjectURL(blob);
			// setDownloadURL(url);
			// setDownloadInfo(incomingFileInfo.current);
			setCompletedFiles((prev) => [
				...prev,
				{ url, info: incomingFileInfo.current },
			]);
		}
	};

	const readSlice = () => {
		const file = currentFile.current;
		if (!file || !fileReader.current || fileReader.current.readyState === 1)
			return;
		if (offset.current >= file.size) return;

		const slice = file.slice(offset.current, offset.current + CHUNK_SIZE);
		fileReader.current.readAsArrayBuffer(slice);
	};

	const sendData = () => {
		sendStartTime.current = now();

		const file = currentFile.current;
		if (!file || !sendChannel.current) return;

		setSendMax(file.size);
		setRecvMax(file.size);

		sendChannel.current.send(
			JSON.stringify({
				type: 'metadata',
				name: file.webkitRelativePath || file.name,
				size: file.size,
			}),
		);

		fileReader.current = new FileReader();
		offset.current = 0;

		fileReader.current.onload = (e) => {
			const result = e.target?.result;
			if (!result || !sendChannel.current) return;

			sendChannel.current.send(result as ArrayBuffer);
			offset.current += (result as ArrayBuffer).byteLength;
			setSendProg(offset.current);

			if (sendChannel.current.bufferedAmount > HIGH_WATER_MARK) {
				return;
			}

			if (offset.current < file.size) {
				readSlice();
			} else {
				setCompletedFiles((prev) => [
					...prev,
					{
						url: '',
						info: {
							name: currentFile.current!.name,
							size: currentFile.current!.size,
						},
					},
				]);
				processQueue();
			}
		};

		fileReader.current.onerror = console.error;
		readSlice();
	};

	const processQueue = () => {
		if (queueRef.current.length > 0) {
			const nextFile = queueRef.current.shift();
			if (nextFile) {
				currentFile.current = nextFile;
				offset.current = 0;
				setSendProg(0);
				setSendMax(0);
				setSendSpeed(0);
				setSendETA(null);
				sendStartTime.current = now();

				if (
					sendChannel.current &&
					sendChannel.current.readyState === 'open'
				) {
					setStatus('sending');
					sendData();
				}
			}
		} else {
			if (
				sendChannel.current &&
				sendChannel.current.readyState === 'open'
			) {
				sendChannel.current.send(JSON.stringify({ type: 'batch-end' }));
			}
			setStatus('completed');
		}
	};

	const setupSendChannel = () => {
		if (!sendChannel.current) return;
		sendChannel.current.binaryType = 'arraybuffer';

		sendChannel.current.bufferedAmountLowThreshold = LOW_WATER_MARK;

		sendChannel.current.onbufferedamountlow = () => {
			readSlice();
		};

		sendChannel.current.onopen = () => {
			setStatus('sending');
			sendData();
		};

		sendChannel.current.onerror = (e) => {
			if (
				(e as RTCErrorEvent).error?.message?.includes(
					'User-Initiated Abort',
				)
			)
				return;
			console.error(e);
		};
	};

	const createConnection = async () => {
		cleanupConnection();
		setStatus('connecting');

		pc.current = new RTCPeerConnection();

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

		if (isOfferer.current) {
			sendChannel.current =
				pc.current.createDataChannel('sendDataChannel');
			setupSendChannel();

			const offer = await pc.current.createOffer();
			await pc.current.setLocalDescription(offer);
			socket.current?.send(JSON.stringify({ type: 'offer', offer }));
		} else {
			pc.current.ondatachannel = (event) => {
				recvChannel.current = event.channel;
				recvChannel.current.binaryType = 'arraybuffer';
				recvChannel.current.onmessage = onReceiveMessage;
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
				if (isOfferer.current) {
					createConnection();
				}
				return;
			}

			if (data.type === 'leave') {
				cleanupConnection();
				return;
			}

			if (data.type === 'signal-abort') {
				cleanupConnection();
				resetStats();
				setStatus('peer-cancelled');
				return;
			}

			if (data.type === 'offer') {
				isOfferer.current = false;
				await createConnection();

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
					const remaining = sendMaxRef.current - sendProgRef.current;
					setSendETA(remaining / speed);
				}
			}

			if (recvStartTime.current && recvProgRef.current > 0) {
				const elapsed =
					(performance.now() - recvStartTime.current) / 1000;
				const speed = recvProgRef.current / elapsed;
				setRecvSpeed(speed);

				if (recvMaxRef.current > 0 && speed > 0) {
					const remaining = recvMaxRef.current - recvProgRef.current;
					setRecvETA(remaining / speed);
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
		currentFile.current = firstFile;
		queueRef.current = rest;
		setTotalFiles(files.length);

		isOfferer.current = true;
		setSendProg(0);
		setRecvProg(0);
		// setDownloadURL(null);
		// setDownloadInfo(null);
		setCompletedFiles([]);

		if (sendChannel.current && sendChannel.current.readyState === 'open') {
			setStatus('sending');
			sendData();
		} else {
			if (socket.current?.readyState === WebSocket.OPEN) {
				socket.current.send(
					JSON.stringify({ type: 'join', room: targetRoomId }),
				);
			}
			setStatus('waiting-for-peer');
		}
	};

	const resetTransfer = () => {
		socket.current?.send(JSON.stringify({ type: 'signal-abort' }));
		cleanupConnection();
		resetStats();
		setStatus('cancelled');
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
		// downloadURL,
		// downloadInfo,
		completedFiles,
		totalFiles,
		startSend,
		resetTransfer,
		clearStatus,
		sendSpeed,
		recvSpeed,
		sendETA,
		recvETA,
	};
};
