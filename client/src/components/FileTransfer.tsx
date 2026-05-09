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
	const [isSender, setIsSender] = useState(false);

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

		let targetRoom = roomId;
		if (!targetRoom) {
			targetRoom = Math.random().toString(36).substring(2, 8);
			onRoomCreated(targetRoom);
			setIsSender(true);
		}

		startSend(files, targetRoom);
	};

	const handleCancel = () => {
		resetTransfer();
		setTimeout(() => {
			clearStatus();
			setFiles([]);
			setIsSender(false);
			onCancel();
		}, 1500);
	};

	const handleSendAnother = () => {
		clearStatus();
		setFiles([]);
	};

	const handleCompletion = () => {
		resetTransfer();
		clearStatus();
		setFiles([]);
		setIsSender(false);
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
						onClick={handleCompletion}
						className="mt-6 px-5 py-2 bg-cyan-400 text-zinc-950 text-sm font-medium rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
					>
						Start New Transfer
					</button>
				</div>
			)}

			{status === 'idle' && (!roomId || isSender) && (
				<FileInput
					files={files}
					setFiles={setFiles}
					onShare={handleShare}
					isWaiting={false}
				/>
			)}

			{status === 'idle' && roomId && !isSender && (
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
							File {currentFileIndex} of {totalFiles}
						</p>
					)}

					<ProgressBar
						label={status === 'receiving' ? 'Receiving' : 'Sending'}
						value={status === 'receiving' ? recvProg : sendProg}
						max={status === 'receiving' ? recvMax : sendMax}
						speed={status === 'receiving' ? recvSpeed : sendSpeed}
						eta={status === 'receiving' ? recvETA : sendETA}
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
						<>
							{completedFiles.map((f, i) => (
								<DownloadLink
									key={i}
									url={f.url}
									info={f.info}
								/>
							))}

							<div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
								<button
									onClick={handleCompletion}
									className="px-6 py-2 text-sm font-medium text-zinc-950 bg-green-400 rounded-md hover:bg-green-300 transition-colors duration-150 active:scale-[0.98]"
								>
									Done
								</button>

								<button
									onClick={handleSendAnother}
									className="px-6 py-2 text-sm font-medium text-zinc-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
								>
									Send Another File
								</button>
							</div>
						</>
					)}
				</div>
			)}
		</section>
	);
};

export default FileTransfer;
