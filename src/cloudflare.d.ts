
declare module 'cloudflare:workers' {
    export const env: {
        PHOTOS: {
            put(
                key: string,
                value: ArrayBuffer | ArrayBufferView | ReadableStream | string,
                options?: {
                    httpMetadata?: {
                        contentType?: string;
                        cacheControl?: string;
                    };
                }
            ): Promise<unknown>;

            get(key: string): Promise<{
                body: ReadableStream;
                httpEtag: string;
                size: number;
                httpMetadata?: {
                    contentType?: string;
                };
            } | null>;

            delete(key: string | string[]): Promise<void>;
        };

        // Cloudflare Worker secret — never expose this to browsers.
        VAPID_PRIVATE_KEY: string;

        // Public configuration values.
        PUBLIC_VAPID_KEY: string;
        VAPID_SUBJECT: string;
    };
}
