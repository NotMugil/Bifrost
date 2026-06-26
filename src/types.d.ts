declare module 'jmuxer' {
    export interface JMuxerOptions {
        node: string | HTMLVideoElement;
        mode?: 'video' | 'audio' | 'both';
        flushingTime?: number;
        clearBuffer?: boolean;
        fps?: number;
        debug?: boolean;
    }
    
    export default class JMuxer {
        constructor(options: JMuxerOptions);
        feed(data: { video?: Uint8Array; audio?: Uint8Array }): void;
        destroy(): void;
    }
}
