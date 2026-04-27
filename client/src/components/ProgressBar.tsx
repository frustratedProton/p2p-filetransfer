type Props = {
	label: string;
	value: number;
};

const ProgressBar = ({ label, value }: Props) => {
	return (
		<div className="progress">
			<div className="label">{label}:</div>
			<progress value={value} max={100}></progress>
		</div>
	);
};

export default ProgressBar;
