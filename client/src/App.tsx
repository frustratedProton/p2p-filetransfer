import { useState, useEffect } from 'react';
import FileTransfer from './components/FileTransfer';

const parseRoomIdFromHash = (): string | null => {
	const hash = window.location.hash.slice(1); 
	if (hash && /^[a-z]+-[a-z]+$/.test(hash)) {
		return hash;
	}
	return null;
};

function App() {
	const [roomId, setRoomId] = useState<string | null>(parseRoomIdFromHash);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const handleHashChange = () => {
			setRoomId(parseRoomIdFromHash());
		};
		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	const handleRoomCreated = (newRoomId: string) => {
		window.history.pushState({}, '', `#${newRoomId}`);
		setRoomId(newRoomId);
	};

	const handleCancel = () => {
		window.history.pushState({}, '', window.location.pathname);
		setRoomId(null);
	};

	const copyLink = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold uppercase tracking-widest text-zinc-400">
						P2P Transfer
					</h1>

					{roomId && (
						<div className="mt-6 flex items-center justify-center">
							<div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full">
								<span className="text-sm font-mono font-semibold tracking-wider text-zinc-300">
									{roomId}
								</span>
								<button
									onClick={copyLink}
									className={`text-xs font-medium ml-2 transition-colors duration-150 ${
										copied
											? 'text-green-400'
											: 'text-cyan-400 hover:text-cyan-300'
									}`}
								>
									{copied ? '✓ Copied' : 'Copy'}
								</button>
							</div>
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
