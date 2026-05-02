import { useState } from 'react';
import FileTransfer from './components/FileTransfer';

const initialRoomId = window.location.hash
	? window.location.hash.slice(1)
	: null;

function App() {
	const [roomId, setRoomId] = useState<string | null>(initialRoomId);
	const [copied, setCopied] = useState(false);

	const handleRoomCreated = (newRoomId: string) => {
		window.history.pushState({}, '', `#${newRoomId}`);
		setRoomId(newRoomId);
	};

	const handleCancel = () => {
		window.history.pushState({}, '', '/');
		setRoomId(null);
		window.location.reload();
	};

	const copyLink = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8">
			<div className="max-w-2xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold tracking-tight text-slate-900">
						P2P File Transfer
					</h1>

					{roomId && (
						<div className="mt-4 flex items-center justify-center gap-3 text-sm">
							<code className="font-mono bg-slate-200 px-3 py-1.5 rounded-lg">
								{roomId}
							</code>
							<button
								onClick={copyLink}
								className="font-medium text-blue-600 hover:underline"
							>
								{copied ? 'Copied!' : 'Copy Link'}
							</button>
							<button
								onClick={handleCancel}
								className="text-red-600 hover:underline text-sm"
							>
								Cancel
							</button>
						</div>
					)}
				</div>

				<FileTransfer
					roomId={roomId}
					onRoomCreated={handleRoomCreated}
					onCancel={handleCancel}
				/>
			</div>
		</div>
	);
}

export default App;
