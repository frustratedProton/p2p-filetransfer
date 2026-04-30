type Props = {
	label: string;
	value: number;
	max: number;
};

const ProgressBar = ({ label, value, max }: Props) => {
	const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

	return (
		<div className="w-full mt-6">
			<div className="flex justify-between mb-1">
				<span className="text-sm font-medium text-gray-700">
					{label}
				</span>
				<span className="text-sm font-medium text-gray-500">
					{percentage}%
				</span>
			</div>
			<div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
				<div
					className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
						percentage >= 100 ? 'bg-green-500' : 'bg-blue-600'
					}`}
					style={{ width: `${percentage}%` }}
				></div>
			</div>
		</div>
	);
};

export default ProgressBar;
