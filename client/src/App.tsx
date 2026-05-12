import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
	const [showQR, setShowQR] = useState(true);

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
		setShowQR(true);
	};

	const copyLink = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const currentUrl = window.location.href;

	return (
		<div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold uppercase tracking-widest text-zinc-400">
						P2P Transfer
					</h1>

					{roomId && (
						<div className="mt-6 flex flex-col items-center gap-4">
							{showQR && (
								<div className="p-4 bg-white rounded-xl shadow-lg">
									<QRCodeSVG
										value={currentUrl}
										size={180}
										bgColor="#ffffff"
										fgColor="#09090b"
										level="M"
									/>
								</div>
							)}

							<div className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg">
								<p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">
									Share this link
								</p>
								<p className="text-sm font-mono text-zinc-300 break-all">
									{currentUrl}
								</p>
							</div>

							<div className="flex items-center gap-3">
								<button
									onClick={copyLink}
									className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 active:scale-[0.98] ${
										copied
											? 'bg-green-400/10 text-green-400'
											: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
									}`}
								>
									{copied ? '✓ Copied' : 'Copy Link'}
								</button>
								<button
									onClick={() => setShowQR((v) => !v)}
									className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 active:scale-[0.98] ${
										showQR
											? 'bg-cyan-400/10 text-cyan-400'
											: 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100'
									}`}
								>
									{showQR ? 'Hide QR' : 'Show QR'}
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
