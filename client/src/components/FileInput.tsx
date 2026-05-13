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

	const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
	};

	const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		const items = e.dataTransfer.items;
		const collectedFiles: File[] = [];

		const traverseEntry = (entry: FileSystemEntry) => {
			if (entry.isFile) {
				const fileEntry = entry as FileSystemFileEntry;
				fileEntry.file((file: File) => {
					if (file.size > 0) collectedFiles.push(file);
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
			if (entry) traverseEntry(entry);
		}

		setTimeout(() => {
			if (collectedFiles.length > 0) setFiles(collectedFiles);
		}, 200);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files ? Array.from(e.target.files) : [];
		if (selected.length > 0) setFiles(selected);
		e.target.value = '';
	};

	const totalSize = files.reduce((acc, f) => acc + f.size, 0);

	return (
		<div className="flex flex-col gap-5">
			<label
				className={`flex flex-col items-center justify-center w-full py-16 sm:py-16 border border-dashed rounded-lg transition-all duration-150 cursor-pointer select-none ${
					dragActive
						? 'border-cyan-500 bg-cyan-950/40 shadow-[inset_0_0_40px_rgba(6,182,212,0.05)]'
						: 'border-zinc-700 bg-zinc-800/20 hover:border-zinc-500 hover:bg-zinc-800/40'
				}`}
				onDragOver={handleDragOver}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileChange}
					className="hidden"
					multiple
				/>

				{files.length > 0 ? (
					<div className="text-center px-6 pointer-events-none">
						<p className="text-base leading-snug text-zinc-100">
							{files.length === 1
								? files[0].name
								: `${files.length} files`}
						</p>
						<p className="text-sm leading-snug text-zinc-400 mt-1">
							{formatFileSize(totalSize)}
						</p>
					</div>
				) : (
					<div className="text-center pointer-events-none px-6">
						<p className="text-base leading-snug text-zinc-200">
							drop files here
						</p>
						<p className="text-sm leading-snug text-zinc-500 mt-1">
							tap or click to browse
						</p>
					</div>
				)}
			</label>

			<input
				type="file"
				ref={folderInputRef}
				onChange={handleFileChange}
				className="hidden"
				multiple
				webkitdirectory=""
			/>

			<button
				type="button"
				onClick={() => folderInputRef.current?.click()}
				className="self-start text-sm leading-snug text-zinc-400 hover:text-zinc-200 transition-colors duration-150 cursor-pointer underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-500"
			>
				browse folder instead
			</button>

			{files.length > 0 && !isWaiting && (
				<button
					onClick={onShare}
					className="w-full py-3 text-base cursor-pointer leading-snug font-medium text-zinc-950 bg-cyan-500 rounded-lg hover:bg-cyan-400 transition-colors duration-150 active:scale-[0.98]"
				>
					send {files.length === 1 ? 'file' : `${files.length} files`}
				</button>
			)}
		</div>
	);
};

export default FileInput;
