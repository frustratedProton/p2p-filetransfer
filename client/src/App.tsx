import { useState } from 'react';
import FileTransfer from './components/FileTransfer';

if (!window.location.hash) {
	const newRoomId = Math.random().toString(36).substring(2, 8);
	window.location.hash = newRoomId;
}

const roomId = window.location.hash.replace('#', '');

function App() {
	const [copied, setCopied] = useState(false);

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

					<div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
						<span>
							Room:{' '}
							<span className="font-mono font-semibold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
								{roomId}
							</span>
						</span>
						<span className="text-slate-300">|</span>
						<button
							onClick={copyLink}
							className={`font-medium transition-colors ${
								copied
									? 'text-green-600'
									: 'text-blue-600 hover:text-blue-800 underline underline-offset-2'
							}`}
						>
							{copied ? '✓ Copied!' : 'Copy Link'}
						</button>
					</div>
				</div>
				<FileTransfer roomId={roomId} />
			</div>
		</div>
	);
}

export default App;
