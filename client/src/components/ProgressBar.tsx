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
		if (!bytesPerSec) return '';
		const k = 1024;
		const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
		const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
		return `${(bytesPerSec / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
	};

	const formatTime = (seconds: number | null) => {
		if (!seconds || seconds === Infinity) return '';
		if (seconds < 60) return `${Math.floor(seconds)}s`;
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}m ${secs}s`;
	};

	const speedStr = formatSpeed(speed ?? 0);
	const etaStr = formatTime(eta ?? null);

	return (
		<div className="w-full flex flex-col gap-2">
			<div className="flex items-baseline justify-between">
				<span className="text-xs text-zinc-500">{label}</span>
				<span className="text-xs text-zinc-400 tabular-nums">
					{percentage}%
				</span>
			</div>

			<div className="w-full h-px bg-zinc-800 relative">
				<div
					className={`absolute top-0 left-0 h-px transition-all duration-150 ease-out ${
						percentage >= 100 ? 'bg-green-600' : 'bg-cyan-600'
					}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>

			{(speedStr || etaStr) && (
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-zinc-600 tabular-nums">
						{speedStr}
					</span>
					<span className="text-xs text-zinc-600 tabular-nums">
						{etaStr}
					</span>
				</div>
			)}
		</div>
	);
};

export default ProgressBar;
