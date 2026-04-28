type Props = {
	label: string;
	value: number;
    max: number;
};

const ProgressBar = ({ label, value, max }: Props) => {
	return (
		<div className="progress">
			<div className="label">{label}:</div>
			<progress value={value} max={max}></progress>
		</div>
	);
};

export default ProgressBar;
