// Tells the type checker what "cloudflare:workers" provides (our photo bucket).
declare module 'cloudflare:workers' {
	export const env: {
		PHOTOS: {
			put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream | string, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
			get(key: string): Promise<{ body: ReadableStream; httpEtag: string; size: number; httpMetadata?: { contentType?: string } } | null>;
			delete(key: string | string[]): Promise<void>;
		};
	};
}
