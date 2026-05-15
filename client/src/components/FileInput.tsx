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

const PREVIEW_COUNT = 5;

const FileInput = ({ files, setFiles, onShare, isWaiting }: Props) => {
	const [dragActive, setDragActive] = useState(false);
	const [listOpen, setListOpen] = useState(true);
	const [showAll, setShowAll] = useState(false);

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
			if (collectedFiles.length > 0) {
				setFiles(collectedFiles);
				setListOpen(true);
				setShowAll(false);
			}
		}, 200);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files ? Array.from(e.target.files) : [];
		if (selected.length > 0) {
			setFiles(selected);
			setListOpen(true);
			setShowAll(false);
		}
		e.target.value = '';
	};

	const handleRemove = (file: File) => {
		const updated = files.filter((f) => f !== file);
		setFiles(updated);
		if (updated.length === 0) {
			setListOpen(false);
			setShowAll(false);
		}
	};

	const totalSize = files.reduce((acc, f) => acc + f.size, 0);
	const preview = files.slice(0, PREVIEW_COUNT);
	const overflow = files.length - PREVIEW_COUNT;

	return (
		<div className="flex flex-col gap-5">
			<label
				className={`flex flex-col items-center justify-center w-full py-16 border border-dashed rounded-lg transition-all duration-150 cursor-pointer select-none ${
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
						<p className="text-xs text-zinc-500 mt-1">
							{formatFileSize(totalSize)} total
						</p>
					</div>
				) : (
					<div className="text-center pointer-events-none">
						<p className="text-base leading-snug text-zinc-200">
							drop files here
						</p>
						<p className="text-sm leading-snug text-zinc-500 mt-1">
							tap or click to browse
						</p>
					</div>
				)}
			</label>

			{files.length > 1 && (
				<div className="flex flex-col gap-1">
					<button
						type="button"
						onClick={() => setListOpen((v) => !v)}
						className="self-start text-sm text-zinc-400 hover:text-zinc-200 transition-colors duration-150 cursor-pointer"
					>
						{listOpen ? 'hide files ↑' : 'show files ↓'}
					</button>

					{listOpen && (
						<div className="flex flex-col mt-1">
							{(showAll ? files : preview).map((f, i) => (
								<div
									key={`${f.name}-${f.size}-${i}`}
									className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0 group"
								>
									<p className="text-sm text-zinc-300 truncate flex-1 mr-4">
										{f.name}
									</p>
									<div className="flex items-center gap-3 shrink-0">
										<p className="text-xs text-zinc-600">
											{formatFileSize(f.size)}
										</p>
										<button
											type="button"
											onClick={() => handleRemove(f)}
											className="text-zinc-700 hover:text-zinc-300 transition-colors duration-150 cursor-pointer opacity-0 group-hover:opacity-100"
										>
											{'\u0078'}
										</button>
									</div>
								</div>
							))}

							{overflow > 0 && !showAll && (
								<button
									type="button"
									onClick={() => setShowAll(true)}
									className="self-start text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer mt-2"
								>
									and {overflow} more ↓
								</button>
							)}

							{showAll && overflow > 0 && (
								<button
									type="button"
									onClick={() => setShowAll(false)}
									className="self-start text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 cursor-pointer mt-2"
								>
									show less ↑
								</button>
							)}
						</div>
					)}
				</div>
			)}

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
					className="text-base cursor-pointer font-semibold text-cyan-500 hover:text-cyan-400 transition-colors duration-150"
				>
					send {files.length === 1 ? 'file' : `${files.length} files`}{' '}
					→
				</button>
			)}
		</div>
	);
};

export default FileInput;
