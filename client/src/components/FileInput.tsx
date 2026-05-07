import React, { useState, useRef } from 'react';

type Props = {
	files: File[];
	setFiles: (files: File[]) => void;
	onShare: () => void;
	isWaiting: boolean;
};

// is this really am i supposed to be doing this
type FileSystemEntry = {
	isFile: boolean;
	isDirectory: boolean;
	name: string;
	fullPath: string;
};

type FileSystemFileEntry = FileSystemEntry & {
	file: (callback: (file: File) => void) => void;
};

type FileSystemDirectoryEntry = FileSystemEntry & {
	createReader: () => {
		readEntries: (callback: (entries: FileSystemEntry[]) => void) => void;
	};
};

type DataTransferItemWithEntry = DataTransferItem & {
	webkitGetAsEntry?: () => FileSystemEntry | null;
};

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const FileInput = ({ files, setFiles, onShare, isWaiting }: Props) => {
	const [dragActive, setDragActive] = useState(false);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const folderInputRef = useRef<HTMLInputElement>(null);

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

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const items = e.dataTransfer.items;
		const collectedFiles: File[] = [];

		const traverseEntry = (entry: FileSystemEntry) => {
			if (entry.isFile) {
				const fileEntry = entry as FileSystemFileEntry;
				fileEntry.file((file: File) => {
					if (file.size > 0) {
						collectedFiles.push(file);
					}
				});
			} else if (entry.isDirectory) {
				const dirEntry = entry as FileSystemDirectoryEntry;
				const reader = dirEntry.createReader();
				reader.readEntries((entries: FileSystemEntry[]) => {
					entries.forEach(traverseEntry);
				});
			}
		};

		for (let i = 0; i < items.length; i++) {
			const item = items[i] as DataTransferItemWithEntry;
			const entry = item.webkitGetAsEntry?.();

			if (entry) {
				traverseEntry(entry);
			}
		}

		setTimeout(() => {
			if (collectedFiles.length > 0) {
				setFiles(collectedFiles);
			}
		}, 200);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = e.target.files ? Array.from(e.target.files) : [];

		setFiles(selectedFiles);
	};

	const openFilePicker = () => {
		fileInputRef.current?.click();
	};

	const openFolderPicker = () => {
		folderInputRef.current?.click();
	};

	return (
		<div
			className={`relative flex flex-col items-center justify-center 
                w-full p-10 border-2 border-dashed rounded-xl 
                transition-all duration-300 ease-in-out ${
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
				ref={fileInputRef}
				onChange={handleChange}
				className="hidden"
				multiple
			/>

			<input
				type="file"
				ref={folderInputRef}
				onChange={handleChange}
				className="hidden"
				multiple
				webkitdirectory=""
			/>

			<div className="flex flex-col items-center gap-3">
				<svg
					className={`w-10 h-10 transition-colors duration-300 ${
						dragActive ? 'text-blue-500' : 'text-gray-400'
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>

				{files.length > 0 ? (
					<div className="text-center">
						<p className="text-sm font-semibold text-gray-800">
							{files.length} file(s) selected
						</p>
						<p className="mt-1 text-xs text-gray-500">
							{formatFileSize(
								files.reduce((acc, f) => acc + f.size, 0),
							)}{' '}
							total
						</p>
					</div>
				) : (
					<p className="text-sm text-gray-500 text-center">
						Drag & drop files or folders here
					</p>
				)}

				<div className="flex gap-4 mt-2">
					<button
						type="button"
						onClick={openFilePicker}
						className="text-blue-600 underline"
					>
						Browse Files
					</button>
					<button
						type="button"
						onClick={openFolderPicker}
						className="text-blue-600 underline"
					>
						Browse Folder
					</button>
				</div>
			</div>

			{files.length > 0 && !isWaiting && (
				<button
					onClick={onShare}
					className="mt-6 px-6 py-2.5 text-sm font-medium
                    text-white bg-blue-600 rounded-lg shadow-sm
                    transition-colors hover:bg-blue-700 focus:outline-none
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Share {files.length} File(s)
				</button>
			)}
		</div>
	);
};

export default FileInput;
