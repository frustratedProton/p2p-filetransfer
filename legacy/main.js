let pc;
let sendChannel;
let recvChannel;
let fileReader;

const fileInput = document.querySelector('#fileInput');
const sendFileBtn = document.querySelector('#sendFile');
const abortBtn = document.querySelector('#abortBtn');
const downloadAnchor = document.querySelector('#download');
const sendProgress = document.querySelector('#sendProgress');
const recvProgress = document.querySelector('#recvProgress');
const sendWrapper = document.querySelector('#sendWrapper');
const recvWrapper = document.querySelector('#recvWrapper');
const statusMsg = document.querySelector('#span');

const socket = new WebSocket('ws://localhost:3000');

let recvBuffer = [];
let recvSize = 0;
let incomingFileInfo = null;

let file = null;
let isOfferer = false;

sendWrapper.style.display = 'none';
recvWrapper.style.display = 'none';

socket.onmessage = async (event) => {
	const data = JSON.parse(event.data);

	if (data.type === 'offer') {
		isOfferer = false;

		if (!pc) {
			await createConnection();
		}

		await pc.setRemoteDescription(data.offer);

		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		socket.send(JSON.stringify({ type: 'answer', answer }));
	}

	if (data.type === 'answer') {
		await pc.setRemoteDescription(data.answer);
	}

	if (data.type === 'candidate') {
		if (pc.remoteDescription) {
			await pc.addIceCandidate(data.candidate);
		} else {
			setTimeout(() => pc.addIceCandidate(data.candidate), 100);
		}
	}
};

fileInput.addEventListener('change', () => {
	file = fileInput.files[0];
	if (file) sendFileBtn.disabled = false;
});

sendFileBtn.addEventListener('click', async () => {
	isOfferer = true;

	sendWrapper.style.display = 'block';
	recvWrapper.style.display = 'none';

	await createConnection();
});

abortBtn.addEventListener('click', () => {
	if (fileReader && fileReader.readyState === 1) {
		fileReader.abort();
	}
});

const createConnection = async () => {
	sendFileBtn.disabled = true;
	abortBtn.disabled = false;

	pc = new RTCPeerConnection();

	pc.onicecandidate = (event) => {
		if (event.candidate) {
			socket.send(
				JSON.stringify({
					type: 'candidate',
					candidate: event.candidate,
				}),
			);
		}
	};

	if (isOfferer) {
		sendChannel = pc.createDataChannel('sendDataChannel');
		setupSendChannel();
	} else {
		pc.ondatachannel = receiveChannelCallback;
	}

	if (isOfferer) {
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		socket.send(JSON.stringify({ type: 'offer', offer }));
	}
};

const setupSendChannel = () => {
	sendChannel.binaryType = 'arraybuffer';
	sendChannel.onopen = () => sendData();
	sendChannel.onerror = (e) => console.error(e);
};

const sendData = () => {
	if (!file) return;

	statusMsg.textContent = '';

	sendProgress.max = file.size;
	recvProgress.max = file.size;

	sendChannel.send(
		JSON.stringify({
			type: 'metadata',
			name: file.name,
			size: file.size,
		}),
	);

	const chunkSize = 16384;
	fileReader = new FileReader();

	let offset = 0;

	fileReader.onload = (e) => {
		sendChannel.send(e.target.result);
		offset += e.target.result.byteLength;

		sendProgress.value = offset;

		if (offset < file.size) {
			readSlice(offset);
		}
	};

	fileReader.onerror = console.error;

	const readSlice = (o) => {
		const slice = file.slice(o, o + chunkSize);
		fileReader.readAsArrayBuffer(slice);
	};

	readSlice(0);
};

const receiveChannelCallback = (event) => {
	recvWrapper.style.display = 'block';
	sendWrapper.style.display = 'none';

	recvChannel = event.channel;
	recvChannel.binaryType = 'arraybuffer';
	recvChannel.onmessage = onReceiveMessage;
};

const onReceiveMessage = (event) => {
	if (typeof event.data === 'string') {
		const data = JSON.parse(event.data);
		if (data.type === 'metadata') {
			incomingFileInfo = data;
			recvProgress.max = data.size;
			return;
		}
	}

	recvBuffer.push(event.data);
	recvSize += event.data.byteLength;

	recvProgress.value = recvSize;

	if (incomingFileInfo && recvSize === incomingFileInfo.size) {
		const blob = new Blob(recvBuffer);
		recvBuffer = [];
		recvSize = 0;

		downloadAnchor.href = URL.createObjectURL(blob);
		downloadAnchor.download = incomingFileInfo.name;
		downloadAnchor.textContent = `Download ${incomingFileInfo.name} (${formatBytes(incomingFileInfo.size)})`;
		downloadAnchor.style.display = 'block';
	}
};

const formatBytes = (bytes) => {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
