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
		<div className="flex items-center justify-between gap-4 py-2 border-b border-zinc-800 last:border-0">
			<div className="overflow-hidden">
				<p className="text-sm text-zinc-300 truncate">{info.name}</p>
				<p className="text-xs text-zinc-600 mt-0.5">
					{formatFileSize(info.size)}
				</p>
			</div>
			<a
				href={url}
				download={info.name}
				className="shrink-0 text-sm text-cyan-400 hover:text-cyan-300 transition-colors duration-150"
			>
				save
			</a>
		</div>
	);
};

export default DownloadLink;
