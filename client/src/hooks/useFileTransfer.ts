import { useState, useEffect, useRef } from 'react';

export const useFileTransfer = (roomId: string) => {
	const [sendProg, setSendProg] = useState<number>(0);
	const [recvProg, setRecvProg] = useState<number>(0);
	const [sendMax, setSendMax] = useState<number>(0);
	const [recvMax, setRecvMax] = useState<number>(0);
	const [downloadURL, setDownloadURL] = useState<string | null>(null);
	const [downloadInfo, setDownloadInfo] = useState<{
		name: string;
		size: number;
	} | null>(null);
	const [isSending, setIsSending] = useState<boolean>(false);
	const [isReceiving, setIsReceiving] = useState<boolean>(false);

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
	const isOfferer = useRef<boolean>(false);
	const currentFile = useRef<File | null>(null);

	const cleanupConnection = () => {
		if (pc.current) {
			pc.current.close();
			pc.current = null;
		}
		if (sendChannel.current) {
			sendChannel.current.close();
			sendChannel.current = null;
		}
		if (recvChannel.current) {
			recvChannel.current.close();
			recvChannel.current = null;
		}
		setIsSending(false);
	};

	const onReceiveMessage = (event: MessageEvent) => {
		setIsReceiving(true);

		if (typeof event.data === 'string') {
			const data = JSON.parse(event.data);
			if (data.type === 'metadata') {
				incomingFileInfo.current = data;
				setRecvMax(data.size);
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
			setDownloadURL(url);
			setDownloadInfo(incomingFileInfo.current);

			setTimeout(() => setIsReceiving(false), 500);
		}
	};

	const readSlice = (o: number) => {
		const file = currentFile.current;
		if (!file || !fileReader.current) return;
		const chunkSize = 16384;
		const slice = file.slice(o, o + chunkSize);
		fileReader.current.readAsArrayBuffer(slice);
	};

	const sendData = () => {
		const file = currentFile.current;
		if (!file || !sendChannel.current) return;

		setSendMax(file.size);
		setRecvMax(file.size);

		sendChannel.current.send(
			JSON.stringify({
				type: 'metadata',
				name: file.name,
				size: file.size,
			}),
		);

		fileReader.current = new FileReader();
		let offset = 0;

		fileReader.current.onload = (e) => {
			const result = e.target?.result;
			if (!result || !sendChannel.current) return;

			sendChannel.current.send(result as ArrayBuffer);
			offset += (result as ArrayBuffer).byteLength;
			setSendProg(offset);

			if (offset < file.size) {
				readSlice(offset);
			}
		};

		fileReader.current.onerror = console.error;
		readSlice(0);
	};

	const setupSendChannel = () => {
		if (!sendChannel.current) return;
		sendChannel.current.binaryType = 'arraybuffer';
		sendChannel.current.onopen = () => sendData();
		sendChannel.current.onerror = (e) => console.error(e);
	};

	const createConnection = async () => {
		cleanupConnection();
		setIsSending(true);

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
			socket.current?.send(
				JSON.stringify({ type: 'join', room: roomId }),
			);
		};

		socket.current.onmessage = async (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'leave') {
				cleanupConnection();
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

			if (data.type === 'signal-abort') {
				cleanupConnection();
				setRecvProg(0);
				setRecvMax(0);
				setIsReceiving(false);
				setDownloadURL(null);
				setDownloadInfo(null);
				return;
			}
		};

		return () => {
			socket.current?.close();
			cleanupConnection();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [roomId]);

	const startSend = (file: File) => {
		currentFile.current = file;
		isOfferer.current = true;
		setIsSending(true);
		setIsReceiving(false);
		setSendProg(0);
		setRecvProg(0);
		setDownloadURL(null);
		setDownloadInfo(null);
		createConnection();
	};

	const abortSend = () => {
		if (fileReader.current && fileReader.current.readyState === 1) {
			fileReader.current.abort();
		}
		socket.current?.send(JSON.stringify({ type: 'abort-signal' }));
		cleanupConnection();
		setSendProg(0);
		setSendMax(0);
		setIsSending(false);
	};

	return {
		sendProg,
		recvProg,
		sendMax,
		recvMax,
		downloadURL,
		downloadInfo,
		isSending,
		startSend,
		isReceiving,
		abortSend,
	};
};
