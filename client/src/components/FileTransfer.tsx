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
		startSend,
		abortSend,
	} = useFileTransfer(roomId);

	const handleSend = () => {
		if (file) startSend(file);
	};

	return (
		<section>
			<h3>File Transfer Component</h3>
			<FileInput
				file={file}
				setFile={setFile}
				onSend={handleSend}
				onAbort={abortSend}
				isSending={isSending}
			/>

			{sendMax > 0 && (
				<ProgressBar label="Sending" value={sendProg} max={sendMax} />
			)}
			{recvMax > 0 && (
				<ProgressBar label="Receiving" value={recvProg} max={recvMax} />
			)}

			<DownloadLink url={downloadURL} info={downloadInfo} />
		</section>
	);
};

export default FileTransfer;
