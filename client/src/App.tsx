import { useState, useEffect, lazy, Suspense } from 'react';

import FileTransfer from './components/FileTransfer';

const QRCodeSVG = lazy(() =>
	import('qrcode.react').then((m) => ({ default: m.QRCodeSVG })),
);

const parseRoomIdFromHash = (): string | null => {
	const hash = window.location.hash.slice(1);
	if (hash && /^[a-z]+-[a-z]+-[a-z]+$/.test(hash)) {
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
		<div className="min-h-screen flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-sm">
				<div className="mb-16">
					<h1 className="text-7xl tracking-tight leading-none">
						<span className="font-extralight text-zinc-300">
							relay
						</span>
						<span className="text-cyan-500">.</span>
					</h1>
					<p className="text-base text-zinc-500 mt-5">
						browser-to-browser. no server.
					</p>
				</div>

				{roomId && (
					<div className="mb-10 flex flex-col gap-5">
						{showQR && (
							<Suspense fallback={null}>
								<div className="self-start p-3 bg-white rounded-lg">
									<QRCodeSVG
										value={currentUrl}
										size={148}
										bgColor="#ffffff"
										fgColor="#09090b"
										level="M"
									/>
								</div>
							</Suspense>
						)}

						<p className="text-sm text-zinc-300 font-mono break-all leading-relaxed px-3 py-2 bg-zinc-800/40 rounded border border-zinc-700/50">
							{currentUrl}
						</p>

						<div className="flex items-center gap-5">
							<button
								onClick={copyLink}
								className={`text-sm cursor-pointer font-medium transition-colors duration-150 ${
									copied
										? 'text-green-400'
										: 'text-cyan-500 hover:text-cyan-400'
								}`}
							>
								{copied ? '✓ copied' : 'copy link'}
							</button>
							<button
								onClick={() => setShowQR((v) => !v)}
								className="text-sm cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
							>
								{showQR ? 'hide qr' : 'show qr'}
							</button>
						</div>
					</div>
				)}

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
