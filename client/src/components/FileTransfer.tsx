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

	return (
		<section className="w-full flex flex-col gap-8">
			{receivedFiles.length > 0 && (
				<div className="flex flex-col gap-2">
					{receivedFiles.map((f, i) => (
						<DownloadLink key={i} url={f.url} info={f.info} />
					))}
				</div>
			)}

			{status === 'cancelled' && (
				<p className="text-sm text-zinc-500">transfer cancelled.</p>
			)}

			{status === 'peer-cancelled' && (
				<div className="flex flex-col gap-4">
					<div>
						<p className="text-sm text-zinc-300 font-medium">
							peer disconnected
						</p>
						<p className="text-xs text-zinc-500 mt-1">
							the other user left or closed the tab.
						</p>
					</div>
					<div className="flex items-center gap-5">
						<button
							onClick={handleDisconnect}
							className="text-sm cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
						>
							go home
						</button>
						<button
							onClick={handleCompletion}
							className="text-sm cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors duration-150"
						>
							new transfer
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
				<div className="flex flex-col gap-3">
					<p className="text-sm text-zinc-300 font-medium">
						waiting for peer
					</p>
					<p className="text-xs text-zinc-500">
						share the link above with the receiver.
					</p>
					<button
						onClick={handleCancel}
						className="self-start cursor-pointer text-sm text-zinc-500 hover:text-zinc-300 transition-colors duration-150 mt-1"
					>
						cancel
					</button>
				</div>
			)}

			{(status === 'sending' ||
				status === 'receiving' ||
				status === 'completed') && (
				<div className="flex flex-col gap-6">
					{totalFiles > 1 && status !== 'completed' && (
						<p className="text-xs text-zinc-500">
							{totalFiles} files
						</p>
					)}

					<ProgressBar
						label={isSendView ? 'sending' : 'receiving'}
						value={isSendView ? sendProg : recvProg}
						max={isSendView ? sendMax : recvMax}
						speed={isSendView ? sendSpeed : recvSpeed}
						eta={isSendView ? sendETA : recvETA}
					/>

					{status === 'completed' && (
						<div className="flex flex-col gap-4">
							<p className="text-base text-zinc-400">done.</p>
							<div className="flex items-center gap-5">
								<button
									onClick={handleDisconnect}
									className="text-sm cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
								>
									go home
								</button>
								<button
									onClick={handleCompletion}
									className="text-sm cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors duration-150"
								>
									send another
								</button>
							</div>
						</div>
					)}

					{status !== 'completed' && (
						<button
							onClick={handleCancel}
							className="self-start text-sm cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
						>
							cancel
						</button>
					)}
				</div>
			)}
		</section>
	);
};

export default FileTransfer;
