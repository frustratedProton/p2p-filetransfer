type Props = {
	url: string;
};

const DownloadLink = ({ url }: Props) => {
	return (
		<a href={url} download>
			Download File
		</a>
	);
};

export default DownloadLink;
