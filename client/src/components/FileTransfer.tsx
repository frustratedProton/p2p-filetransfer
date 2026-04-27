import { useState } from 'react';
import FileInput from './FileInput';
import ProgressBar from './ProgressBar';
import DownloadLink from './DownloadLink';

const FileTransfer = () => {
	const [file, setFile] = useState<File | null>(null);
	const [sendProg, setSendProg] = useState<number>(0);
	const [recvProg, setRecvProg] = useState<number>(0);
	const [downloadURL, setDownloadURL] = useState<string | null>(null);

	return (
		<section>
			<h3>File Transfer Component</h3>
			<FileInput file={file} setFile={setFile} />

			<ProgressBar label="Sending" value={sendProg} />
			<ProgressBar label="Receiving" value={recvProg} />

			<DownloadLink url={downloadURL} />
		</section>
	);
};

export default FileTransfer;
