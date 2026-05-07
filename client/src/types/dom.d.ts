import 'react';

declare module 'react' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	type ExtendedInputAttributes<T> = {
		webkitdirectory?: string;
		directory?: string;
	};

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface InputHTMLAttributes<T> extends ExtendedInputAttributes<T> {}
}
