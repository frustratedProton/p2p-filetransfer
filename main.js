'use strict';

let pc;
let dataChannel;

const fileInput = document.getElementById('fileInput');
const sendBtn = document.getElementById('sendBtn');
const statusDiv = document.getElementById('status');
const offerArea = document.getElementById('offerArea');
const answerArea = document.getElementById('answerArea');

sendBtn.addEventListener('click', startConnection);

const startConnection = async () => {
	const file = fileInput.files[0];
	if (!file) {
		statusDiv.textContent = 'Please select a file first.';
		return;
	}

	pc = new RTCPeerConnection();

	dataChannel = pc.createDataChannel('fileTransfer');
	dataChannel.binaryType = 'arraybuffer';

	dataChannel.onopen = () => {
		statusDiv.textContent = 'Channel open, sending file';
		sendFile(file);
	};

	dataChannel.onclose = () => {
		statusDiv.textContent = 'Channel closed';
	};

	dataChannel.onerror = (err) => console.error(err);

	pc.onicecandidate = (e) => {
		if (!e.candidate) {
			offerArea.textContent = JSON.stringify(pc.localDescription);
		}
	};

	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);

	statusDiv.textContent = 'Offer created. copy and send to receiver.';
};

const setAnswer = async (answerJSON) => {
	const answer = new RTCSessionDescription(JSON.parse(answerJSON));
	await pc.setRemoteDescripton(answer);
	statusDiv.textContent = 'Connected';
};

const sendFile = (file) => {
	const reader = new FileReader();

	reader.onload = (e) => {
		dataChannel.send(e.target.result);
		statusDiv.textContent = `File sent: ${file.name}`;
	};

	reader.readAsArrayBuffer(file);
};

const receiveConnection = async (offerJSON) => {
	pc = new RTCPeerConnection();

	pc.ondatachannel = (event) => {
		const receiveChannel = event.channel;

		receiveChannel.onmessage = (e) => {
			const blob = new Blob([e.data]);
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = 'received_file';
			a.textContent = 'Download received file';
			document.body.appendChild(a);

			statusDiv.textContent = 'File received';
		};
	};

	pc.onicecandidate = (event) => {
		if (!event.candidate) {
			answerArea.textContent = JSON.stringify(pc.localDescription);
		}
	};

    const offer = new RTCSessionDescription(JSON.parse(offerJSON));
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    statusDiv.textContent = 'Answer created. send back'
};
