import FileTransfer from './components/FileTransfer';

if (!window.location.hash) {
	const newRoomId = Math.random().toString(36).substring(2, 8);
	window.location.hash = newRoomId;
}

const roomId = window.location.hash.replace('#', '');

function App() {
	return (
		<div>
			<h1>P2P File Transfer</h1>
			<p style={{ fontSize: '0.9rem', color: '#666' }}>
				Room: <strong>{roomId}</strong> | Share this URL to connect!
			</p>
			<FileTransfer roomId={roomId} />
		</div>
	);
}

export default App;
