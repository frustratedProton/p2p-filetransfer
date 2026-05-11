import { useState } from 'react';
import FileInput from './FileInput';
import ProgressBar from './ProgressBar';
import DownloadLink from './DownloadLink';
import { useFileTransfer } from '../hooks/useFileTransfer';
import { generateRoomId } from '../utils/roomId';

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
		receivedFiles,
		totalFiles,
		startSend,
		resetTransfer,
		clearStatus,
		lastDirection,
		disconnect,
		sendSpeed,
		recvSpeed,
		sendETA,
		recvETA,
	} = useFileTransfer(roomId, onRoomCreated);

	const handleShare = () => {
		if (files.length === 0) return;

		let targetRoom = roomId;
		if (!targetRoom) {
			targetRoom = generateRoomId();
			onRoomCreated(targetRoom);
		}

		startSend(files, targetRoom);
	};

	const handleCancel = () => {
		resetTransfer();
		clearStatus();
		setFiles([]);
	};

	const handleCompletion = () => {
		clearStatus();
		setFiles([]);
	};

	const handleDisconnect = () => {
		disconnect();
		onCancel();
		setFiles([]);
	};

	const isSendView = lastDirection === 'send';

	const currentFileIndex =
		status === 'sending' || status === 'receiving'
			? totalFiles - (status === 'sending' ? 0 : 0)
			: 0;
	void currentFileIndex;

	return (
		<section className="w-full flex flex-col gap-6">
			{receivedFiles.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
						Received Files
					</p>
					{receivedFiles.map((f, i) => (
						<DownloadLink key={i} url={f.url} info={f.info} />
					))}
				</div>
			)}

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
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
						<button
							onClick={handleDisconnect}
							className="px-5 py-2 bg-zinc-700 text-zinc-100 text-sm font-medium rounded-md hover:bg-zinc-600 transition-colors duration-150 active:scale-[0.98]"
						>
							Go Home
						</button>
						<button
							onClick={handleCompletion}
							className="px-5 py-2 bg-cyan-400 text-zinc-950 text-sm font-medium rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
						>
							Start New Transfer
						</button>
					</div>
				</div>
			)}

			{status === 'idle' && (
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

			{(status === 'sending' ||
				status === 'receiving' ||
				status === 'completed') && (
				<div className="flex flex-col gap-4">
					{status === 'completed' && (
						<p className="text-sm font-semibold text-green-400 uppercase tracking-widest text-center">
							Transfer Complete
						</p>
					)}

					{totalFiles > 1 && status !== 'completed' && (
						<p className="text-xs text-zinc-500 font-mono tracking-wider">
							Transferring {totalFiles} files
						</p>
					)}

					<ProgressBar
						label={isSendView ? 'Sending' : 'Receiving'}
						value={isSendView ? sendProg : recvProg}
						max={isSendView ? sendMax : recvMax}
						speed={isSendView ? sendSpeed : recvSpeed}
						eta={isSendView ? sendETA : recvETA}
					/>

					{status !== 'completed' && (
						<div className="text-center">
							<button
								onClick={handleCancel}
								className="text-xs uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors duration-150"
							>
								Cancel
							</button>
						</div>
					)}

					{status === 'completed' && (
						<div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
							<button
								onClick={handleDisconnect}
								className="px-6 py-2 text-sm font-medium text-zinc-100 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors duration-150 active:scale-[0.98]"
							>
								Go Home
							</button>
							<button
								onClick={handleCompletion}
								className="px-6 py-2 text-sm font-medium text-zinc-950 bg-green-400 rounded-md hover:bg-green-300 transition-colors duration-150 active:scale-[0.98]"
							>
								Send Another
							</button>
						</div>
					)}
				</div>
			)}
		</section>
	);
};

export default FileTransfer;
