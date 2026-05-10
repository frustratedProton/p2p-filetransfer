import React, { useState, useRef } from 'react';

type Props = {
	files: File[];
	setFiles: (files: File[]) => void;
	onShare: () => void;
	isWaiting: boolean;
};

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
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
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

	const openFolderPicker = (e: React.MouseEvent) => {
		e.stopPropagation();
		folderInputRef.current?.click();
	};

	return (
		<div
			className={`relative flex flex-col items-center justify-center 
                w-full p-8 sm:p-16 border rounded-lg transition-colors duration-150 cursor-pointer ${
					dragActive
						? 'border-cyan-400 bg-zinc-800/50'
						: 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
				}`}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={openFilePicker}
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

			<div className="flex flex-col items-center gap-4">
				<svg
					className={`w-12 h-12 transition-colors duration-150 ${
						dragActive ? 'text-cyan-400' : 'text-zinc-700'
					}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>

				{files.length > 0 ? (
					<div className="text-center">
						<p className="text-sm font-medium text-zinc-300">
							{files.length} file(s) selected
						</p>
						<p className="mt-1 text-xs text-zinc-600 font-mono">
							{formatFileSize(
								files.reduce((acc, f) => acc + f.size, 0),
							)}{' '}
							total
						</p>
					</div>
				) : (
					<p className="text-sm text-zinc-600 text-center">
						Tap to select files or drop here
					</p>
				)}

				<div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-2">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							openFilePicker();
						}}
						className="text-xs uppercase tracking-widest text-zinc-500 hover:text-cyan-400 transition-colors duration-150 py-2 px-4 rounded-md hover:bg-zinc-800"
					>
						Browse Files
					</button>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							openFolderPicker(e);
						}}
						className="text-xs uppercase tracking-widest text-zinc-500 hover:text-cyan-400 transition-colors duration-150 py-2 px-4 rounded-md hover:bg-zinc-800"
					>
						Browse Folder
					</button>
				</div>
			</div>

			{files.length > 0 && !isWaiting && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onShare();
					}}
					className="mt-8 px-8 py-3 text-sm font-medium text-zinc-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98] w-full sm:w-auto"
				>
					Send {files.length} File(s)
				</button>
			)}
		</div>
	);
};

export default FileInput;
