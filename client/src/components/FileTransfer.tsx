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
	const [isWaitingForPeer, setIsWaitingForPeer] = useState(false);

	const {
		sendProg,
		recvProg,
		sendMax,
		recvMax,
		downloadURL,
		downloadInfo,
		isSending,
		isReceiving,
		startSend,
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
		setIsWaitingForPeer(true);
	};

	return (
		<section className="w-full max-w-xl mx-auto mt-8 flex flex-col gap-4">
			{!roomId && (
				<FileInput
					file={file}
					setFile={setFile}
					onShare={handleShare}
					isWaiting={isWaitingForPeer}
				/>
			)}

			{roomId && isWaitingForPeer && sendMax === 0 && (
				<div className="text-center p-8 bg-blue-50 border-2 border-blue-300 rounded-xl">
					<p className="text-lg font-semibold text-blue-900">
						Waiting for peer...
					</p>
					<p className="text-sm text-blue-700 mt-2">
						Share the link at the top with the receiver!
					</p>
					<button
						onClick={onCancel}
						className="mt-4 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Cancel Transfer
					</button>
				</div>
			)}

			{roomId &&
				!isWaitingForPeer &&
				!isSending &&
				!isReceiving &&
				!downloadURL && (
					<div className="text-center p-6 bg-amber-50 border border-amber-200 rounded-lg">
						<p className="text-amber-700 font-medium">
							Connected to room!
						</p>
						<p className="text-sm text-amber-500 mt-1">
							Waiting for the sender to start the transfer...
						</p>
						<button
							onClick={onCancel}
							className="mt-4 text-sm text-blue-600 hover:underline underline-offset-2"
						>
							Or click here to start a new transfer
						</button>
					</div>
				)}

			{sendMax > 0 && !isReceiving && (
				<ProgressBar
					label="Sending"
					value={sendProg}
					max={sendMax}
					speed={sendSpeed}
					eta={sendETA}
				/>
			)}

			{recvMax > 0 && isReceiving && (
				<ProgressBar
					label="Receiving"
					value={recvProg}
					max={recvMax}
					speed={recvSpeed}
					eta={recvETA}
				/>
			)}

			<DownloadLink url={downloadURL} info={downloadInfo} />
		</section>
	);
};

export default FileTransfer;
