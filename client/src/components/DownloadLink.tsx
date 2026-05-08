type Props = {
	url: string | null;
	info: { name: string; size: number } | null;
};

const formatFileSize = (bytes: number) => {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const DownloadLink = ({ url, info }: Props) => {
	if (!url || !info) return null;

	return (
		<div className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
			<div className="flex items-center gap-3 overflow-hidden mr-4">
				<svg
					className="w-5 h-5 text-cyan-400 shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div className="overflow-hidden">
					<p className="text-sm font-medium text-zinc-300 truncate">
						{info.name}
					</p>
					<p className="text-xs text-zinc-600 font-mono">
						{formatFileSize(info.size)}
					</p>
				</div>
			</div>

			<a
				href={url}
				download={info.name}
				className="shrink-0 px-4 py-1.5 text-xs font-medium text-zinc-950 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors duration-150 active:scale-[0.98]"
			>
				Save
			</a>
		</div>
	);
};

export default DownloadLink;
