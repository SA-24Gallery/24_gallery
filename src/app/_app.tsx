import type { AppProps } from 'next/app';
import { DatabaseManager } from '@/components/DatabaseManager';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <DatabaseManager />
            <Component {...pageProps} />
        </>
    );
}