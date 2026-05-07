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
		// downloadURL,
		// downloadInfo,
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
		startSend(files, newRoomId); // ✅ pass full array
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
		<section className="w-full max-w-xl mx-auto mt-8 flex flex-col gap-4">
			{status === 'cancelled' && (
				<div className="text-center p-8 bg-red-50 border-2 border-red-200 rounded-xl animate-pulse">
					<p className="text-lg font-semibold text-red-700">
						Transfer Cancelled
					</p>
					<p className="text-sm text-red-500 mt-1">Resetting...</p>
				</div>
			)}

			{status === 'peer-cancelled' && (
				<div className="text-center p-8 bg-red-50 border-2 border-red-200 rounded-xl">
					<p className="text-lg font-semibold text-red-700">
						Peer Cancelled Transfer
					</p>
					<p className="text-sm text-red-500 mt-1">
						The other user disconnected or cancelled.
					</p>
					<button
						onClick={handleResetFromPeer}
						className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
				<div className="text-center p-8 bg-blue-50 border-2 border-blue-300 rounded-xl">
					<p className="text-lg font-semibold text-blue-900">
						Waiting for peer...
					</p>
					<p className="text-sm text-blue-700 mt-2">
						Share the link at the top with the receiver!
					</p>
					<button
						onClick={handleCancel}
						className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Cancel Transfer
					</button>
				</div>
			)}

			{status === 'idle' && roomId && (
				<div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-lg">
					<p className="text-amber-700 font-medium">
						Connected to room!
					</p>
					<p className="text-sm text-amber-500 mt-1">
						Waiting for the sender to start the transfer...
					</p>
				</div>
			)}

			{(status === 'sending' || status === 'receiving') && (
				<div>
					{totalFiles > 1 && (
						<p className="text-sm text-gray-600 mb-2 font-medium">
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

					<div className="text-center mt-3">
						<button
							onClick={handleCancel}
							className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
						>
							Cancel All
						</button>
					</div>
				</div>
			)}

			{status === 'completed' && (
				<>
					{completedFiles.map((f, i) => (
						<DownloadLink key={i} url={f.url} info={f.info} />
					))}

					<div className="text-center mt-4">
						<button
							onClick={handleResetFromPeer}
							className="px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							Send Another File
						</button>
					</div>
				</>
			)}
		</section>
	);
};

export default FileTransfer;
