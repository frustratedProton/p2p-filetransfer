type Props = {
	label: string;
	value: number;
	max: number;
	speed?: number;
	eta?: number | null;
};

const ProgressBar = ({ label, value, max, speed, eta }: Props) => {
	const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

	const formatSpeed = (bytesPerSec: number) => {
		if (!bytesPerSec) return '0 MB/s';
		return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
	};

	const formatTime = (seconds: number | null) => {
		if (!seconds || seconds === Infinity) return '--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}m ${secs}s`;
	};

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

			<div className="flex justify-between text-xs text-gray-500 mt-1">
				<span>{formatSpeed(speed ?? 0)}</span>
				<span>ETA: {formatTime(eta ?? null)}</span>
			</div>
		</div>
	);
};

export default ProgressBar;
