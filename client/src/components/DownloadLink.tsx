type Props = {
	url: string | null;
	info: { name: string; size: number } | null;
};

const DownloadLink = ({ url, info }: Props) => {
	if (!url || !info) return null;

	const formatByte = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
	};

	return (
		<div className="mt-6 w-full p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between transition-all hover:bg-green-100">
			<div className="flex items-center gap-3 overflow-hidden mr-4">
				{/* Check/Success Icon */}
				<svg
					className="w-6 h-6 text-green-600 shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div className="overflow-hidden">
					<p className="text-sm font-medium text-green-800 truncate">
						{info.name}
					</p>
					<p className="text-xs text-green-600">
						{formatByte(info.size)}
					</p>
				</div>
			</div>

			<a
				href={url}
				download={info.name}
				className="shrink-0 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
			>
				Save File
			</a>
		</div>
	);
};

export default DownloadLink;
    