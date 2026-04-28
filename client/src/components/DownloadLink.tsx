type Props = {
	url: string;
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
		<a href={url}>
			Download {info.name} ({formatByte(info.size)})
		</a>
	);
};

export default DownloadLink;
