import React, { useState, useRef } from 'react';

type Props = {
	file: File | null;
	setFile: (file: File | null) => void;
	onSend: () => void;
	onAbort: () => void;
	isSending: boolean;
};

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
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
			className={`relative flex flex-col items-center justify-center w-full p-10 border-2 border-dashed rounded-xl transition-all duration-300 ease-in-out ${
				dragActive
					? 'border-blue-500 bg-blue-50 scale-[1.02]'
					: 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
			}`}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			<input
				type="file"
				ref={inputRef}
				onChange={handleChange}
				className="hidden"
			/>

			<div
				className="flex flex-col items-center gap-3 cursor-pointer"
				onClick={handleOpenDialog}
			>
				<svg
					className={`w-10 h-10 transition-colors duration-300 ${
						dragActive ? 'text-blue-500' : 'text-gray-400'
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>

				{file ? (
					<div className="text-center">
						<p className="text-sm font-semibold text-gray-800">
							{file.name}
						</p>
						<p className="mt-1 text-xs text-gray-500">
							{formatFileSize(file.size)}
						</p>
					</div>
				) : (
					<p className="text-sm text-gray-500">
						Drag & drop a file here, or{' '}
						<span className="font-medium text-blue-600 underline">
							browse
						</span>
					</p>
				)}
			</div>

			<div className="flex mt-6 space-x-3">
				<button
					disabled={!file || isSending}
					onClick={(e) => {
						e.stopPropagation();
						onSend();
					}}
					className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Send File
				</button>
				<button
					disabled={!isSending}
					onClick={(e) => {
						e.stopPropagation();
						onAbort();
					}}
					className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Abort
				</button>
			</div>
		</div>
	);
};

export default FileInput;
