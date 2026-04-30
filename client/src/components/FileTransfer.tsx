import { useState } from 'react';
import FileInput from './FileInput';
import ProgressBar from './ProgressBar';
import DownloadLink from './DownloadLink';
import { useFileTransfer } from '../hooks/useFileTransfer';

type Props = {
	roomId: string;
};

const FileTransfer = ({ roomId }: Props) => {
	const [file, setFile] = useState<File | null>(null);
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
		abortSend,
	} = useFileTransfer(roomId);

	const handleSend = () => {
		if (file) startSend(file);
	};

	return (
		<section className="w-full max-w-xl mx-auto mt-8 flex flex-col gap-4">
			<FileInput
				file={file}
				setFile={setFile}
				onSend={handleSend}
				onAbort={abortSend}
				isSending={isSending || isReceiving}
			/>

			{sendMax > 0 && !isReceiving && (
				<ProgressBar label="Sending" value={sendProg} max={sendMax} />
			)}
			{recvMax > 0 && isReceiving && (
				<ProgressBar label="Receiving" value={recvProg} max={recvMax} />
			)}

			<DownloadLink url={downloadURL} info={downloadInfo} />
		</section>
	);
};

export default FileTransfer;
