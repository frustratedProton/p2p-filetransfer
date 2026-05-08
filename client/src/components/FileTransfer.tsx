import { useState } from 'react';
import FileInput from './FileInput';
import ProgressBar from './ProgressBar';
import DownloadLink from './DownloadLink';
import { useFileTransfer } from '../hooks/useFileTransfer';

type Props = {
	roomId: string | null;
	onRoomCreated: (roomId: string) => void;
	onCancel: () => void;
};

const FileTransfer = ({ roomId, onRoomCreated, onCancel }: Props) => {
	const [files, setFiles] = useState<File[]>([]);

	const {
		status,
		sendProg,
		recvProg,
		sendMax,
		recvMax,
		completedFiles,
		totalFiles,
		startSend,
		resetTransfer,
		clearStatus,
		sendSpeed,
		recvSpeed,
		sendETA,
		recvETA,
	} = useFileTransfer(roomId);

	const handleShare = () => {
		if (files.length === 0) return;
		const newRoomId = Math.random().toString(36).substring(2, 8);
		onRoomCreated(newRoomId);
		startSend(files, newRoomId);
	};

	const handleCancel = () => {
		resetTransfer();
		setTimeout(() => {
			clearStatus();
			setFiles([]);
			onCancel();
		}, 1500);
	};

	const handleResetFromPeer = () => {
		clearStatus();
		setFiles([]);
		onCancel();
	};

	const currentFileIndex =
		status === 'sending' || status === 'receiving'
			? completedFiles.length + 1
			: completedFiles.length;

	return (
		<section className="w-full flex flex-col gap-6">
			{status === 'cancelled' && (
				<div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
					<p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
						Cancelled
					</p>
					<p className="text-xs text-zinc-600 mt-2">Resetting...</p>
				</div>
			)}

			{status === 'peer-cancelled' && (
				<div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
					<p className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
						Peer Disconnected
					</p>
					<p className="text-xs text-zinc-600 mt-2">
						The other user cancelled or closed the tab.
					</p>
					<button
						onClick={handleResetFromPeer}
						className="mt-6 px-5 py-2 bg-cyan-400 text-zinc-950 text-sm font-medium rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
					>
						Start New Transfer
					</button>
				</div>
			)}

			{status === 'idle' && !roomId && (
				<FileInput
					files={files}
					setFiles={setFiles}
					onShare={handleShare}
					isWaiting={false}
				/>
			)}

			{status === 'waiting-for-peer' && (
				<div className="text-center p-8 bg-zinc-900 border border-zinc-800 rounded-lg">
					<p className="text-sm font-semibold text-cyan-400 uppercase tracking-widest">
						Waiting for peer...
					</p>
					<p className="text-xs text-zinc-500 mt-2">
						Share the link at the top with the receiver.
					</p>
					<button
						onClick={handleCancel}
						className="mt-6 text-xs uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
					>
						Cancel
					</button>
				</div>
			)}

			{status === 'idle' && roomId && (
				<div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
					<p className="text-zinc-400 font-medium text-sm flex items-center justify-center gap-2">
						<span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
						Connected
					</p>
					<p className="text-xs text-zinc-600 mt-2">
						Waiting for the sender to start...
					</p>
				</div>
			)}

			{(status === 'sending' || status === 'receiving') && (
				<div className="flex flex-col gap-4">
					{totalFiles > 1 && (
						<p className="text-xs text-zinc-500 font-mono tracking-wider">
							File {currentFileIndex} of {totalFiles}
						</p>
					)}

					<ProgressBar
						label={status === 'sending' ? 'Sending' : 'Receiving'}
						value={status === 'sending' ? sendProg : recvProg}
						max={status === 'sending' ? sendMax : recvMax}
						speed={status === 'sending' ? sendSpeed : recvSpeed}
						eta={status === 'sending' ? sendETA : recvETA}
					/>

					<div className="text-center">
						<button
							onClick={handleCancel}
							className="text-xs uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{status === 'completed' && (
				<div className="flex flex-col gap-4">
					{completedFiles.map((f, i) => (
						<DownloadLink key={i} url={f.url} info={f.info} />
					))}

					<div className="text-center mt-2">
						<button
							onClick={handleResetFromPeer}
							className="px-6 py-2 text-sm font-medium text-zinc-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
						>
							Send Another File
						</button>
					</div>
				</div>
			)}
		</section>
	);
};

export default FileTransfer;
