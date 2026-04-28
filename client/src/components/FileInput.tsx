import React, { useState, useRef } from 'react';

type Props = {
	file: File | null;
	setFile: (file: File | null) => void;
	onSend: () => void;
	onAbort: () => void;
	isSending: boolean;
};

const FileInput = ({ file, setFile, onSend, onAbort, isSending }: Props) => {
	const [dragActive, setDragActive] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const files = e.dataTransfer.files;

		if (files.length > 1) {
			alert('Only one file allowed');
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

	const handleOpenDialog = () => {
		inputRef.current?.click();
	};

	return (
		<div
			className={`drop-zone ${dragActive ? 'active' : ''}`}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<input
				type="file"
				ref={inputRef}
				onChange={handleChange}
				style={{ display: 'none' }}
			/>

			<p onClick={handleOpenDialog} style={{ cursor: 'pointer' }}>
				{file
					? `Selected: ${file.name}`
					: 'Drag & drop a file here or click to select'}
			</p>

			<button disabled={!file || isSending} onClick={onSend}>
				Send
			</button>
			<button disabled={!isSending} onClick={onAbort}>
				Abort
			</button>
		</div>
	);
};

export default FileInput;
