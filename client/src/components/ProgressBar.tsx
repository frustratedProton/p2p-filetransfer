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
		if (!bytesPerSec) return '0 B/s';
		const k = 1024;
		const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
		const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
		return `${(bytesPerSec / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
	};

	const formatTime = (seconds: number | null) => {
		if (!seconds || seconds === Infinity) return '--';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}m ${secs}s`;
	};

	return (
		<div className="w-full">
			<div className="flex justify-between mb-2">
				<span className="text-xs uppercase tracking-widest text-zinc-500">
					{label}
				</span>
				<span className="text-xs font-mono text-zinc-500">
					{percentage}%
				</span>
			</div>

			<div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
				<div
					className={`h-1 rounded-full transition-all duration-150 ease-out ${
						percentage >= 100 ? 'bg-green-400' : 'bg-cyan-400'
					}`}
					style={{ width: `${percentage}%` }}
				></div>
			</div>

			<div className="flex justify-between text-xs text-zinc-600 font-mono mt-2">
				<span>{formatSpeed(speed ?? 0)}</span>
				<span>{formatTime(eta ?? null)}</span>
			</div>
		</div>
	);
};

export default ProgressBar;
