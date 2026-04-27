import React, { useState } from 'react';

type Props = {
	file: File | null;
	setFile: (file: File | null) => void;
};

const FileInput = ({ file, setFile }: Props) => {
	const [dragActive, setDragActive] = useState<boolean>(false);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setDragActive(true);

		const files = e.dataTransfer.files;

		if (files.length > 1) {
			alert('only one file allowed');
			return;
		}

		const droppedFile = files[0];

		if (droppedFile) {
			setFile(droppedFile);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0] || null;
		setFile(selectedFile);
	};

	return (
		<div
			className={`drop-zone ${dragActive ? 'active' : ''}`}
			onDragOver={handleDragOver}
			onDragEnter={() => setDragActive(true)}
			onDragLeave={() => setDragActive(false)}
			onDrop={handleDrop}
		>
			<input type="file" onChange={handleChange} />

			<p>
				{file
					? `Selected: ${file.name}`
					: 'Drag & drop a file here or click to select'}
			</p>

			<button disabled={!file}>Send</button>
			<button>Abort</button>
		</div>
	);
};

export default FileInput;
