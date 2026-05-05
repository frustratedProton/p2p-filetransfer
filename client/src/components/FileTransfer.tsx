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
	const [file, setFile] = useState<File | null>(null);

	const {
		status,
		sendProg,
		recvProg,
		sendMax,
		recvMax,
		downloadURL,
		downloadInfo,
		startSend,
		resetTransfer,
		clearStatus,
		sendSpeed,
		recvSpeed,
		sendETA,
		recvETA,
	} = useFileTransfer(roomId);

	const handleShare = () => {
		if (!file) return;
		const newRoomId = Math.random().toString(36).substring(2, 8);
		onRoomCreated(newRoomId);
		startSend(file, newRoomId);
	};

	const handleCancel = () => {
		resetTransfer();
		setTimeout(() => {
			clearStatus();
			setFile(null);
			onCancel();
		}, 1500);
	};

	const handleResetFromPeer = () => {
		clearStatus();
		setFile(null);
		onCancel();
	};

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
					file={file}
					setFile={setFile}
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
					<button
						onClick={handleResetFromPeer}
						className="mt-4 text-sm text-blue-600 hover:underline underline-offset-2"
					>
						Or click here to start a new transfer
					</button>
				</div>
			)}

			{status === 'sending' && (
				<div>
					<ProgressBar
						label="Sending"
						value={sendProg}
						max={sendMax}
						speed={sendSpeed}
						eta={sendETA}
					/>
					<div className="text-center mt-3">
						<button
							onClick={handleCancel}
							className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
						>
							Cancel Transfer
						</button>
					</div>
				</div>
			)}

			{status === 'receiving' && (
				<div>
					<ProgressBar
						label="Receiving"
						value={recvProg}
						max={recvMax}
						speed={recvSpeed}
						eta={recvETA}
					/>
					<div className="text-center mt-3">
						<button
							onClick={handleCancel}
							className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
						>
							Cancel Download
						</button>
					</div>
				</div>
			)}

			{status === 'completed' && (
				<>
					<DownloadLink url={downloadURL} info={downloadInfo} />
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
