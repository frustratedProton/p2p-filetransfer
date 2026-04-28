import { useState, useEffect, useRef } from 'react';

type Metadata = { name: string; size: number };

export const useFileTransfer = () => {
	const [sendProg, setSendProg] = useState<number>(0);
	const [recvProg, setRecvProg] = useState<number>(0);
	const [sendMax, setSendMax] = useState<number>(0);
	const [recvMax, setRecvMax] = useState<number>(0);
	const [downloadURL, setDownloadURL] = useState<string | null>(null);
	const [downloadInfo, setDownloadInfo] = useState<Metadata | null>(null);
	const [isSending, setIsSending] = useState<boolean>(false);

	const pc = useRef<RTCPeerConnection | null>(null);
	const sendChannel = useRef<RTCDataChannel | null>(null);
	const recvChannel = useRef<RTCDataChannel | null>(null);
	const fileReader = useRef<FileReader | null>(null);
	const socket = useRef<WebSocket | null>(null);

	const recvBuffer = useRef<ArrayBuffer[]>([]);
	const recvSize = useRef<number>(0);
	const incomingFileInfo = useRef<Metadata | null>(null);
	const isOfferer = useRef<boolean>(false);
	const currentFile = useRef<File | null>(null);

	const onReceiveMessage = (event: MessageEvent) => {
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
		}
	};

	const readSlice = (o: number) => {
		const file = currentFile.current;
		if (!file) return;
		const chunkSize = 16384;
		const slice = file.slice(o, o + chunkSize);
		fileReader.current?.readAsArrayBuffer(slice);
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
		} else {
			pc.current.ondatachannel = (event) => {
				recvChannel.current = event.channel;
				recvChannel.current.binaryType = 'arraybuffer';
				recvChannel.current.onmessage = onReceiveMessage;
			};
		}

		if (isOfferer.current) {
			const offer = await pc.current.createOffer();
			await pc.current.setLocalDescription(offer);
			socket.current?.send(JSON.stringify({ type: 'offer', offer }));
		}
	};

	useEffect(() => {
		socket.current = new WebSocket('ws://localhost:3000');

		socket.current.onmessage = async (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'offer') {
				isOfferer.current = false;
				if (!pc.current) await createConnection();
				await pc.current.setRemoteDescription(data.offer);

				const answer = await pc.current.createAnswer();
				await pc.current.setLocalDescription(answer);
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
			pc.current?.close();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const startSend = (file: File) => {
		currentFile.current = file;
		isOfferer.current = true;
		createConnection();
	};

	const abortSend = () => {
		if (fileReader.current && fileReader.current.readyState === 1) {
			fileReader.current.abort();
			setIsSending(false);
		}
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
		abortSend,
	};
};
