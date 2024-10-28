'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function DatabaseManager() {
    const pathname = usePathname();

    const disconnectDatabase = useCallback(async () => {
        try {
            const response = await fetch('/api/disconnect', {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to disconnect database');
            }
        } catch (error) {
            console.error('Failed to disconnect database:', error);
        }
    }, []);

    useEffect(() => {
        let isDisconnecting = false;

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!isDisconnecting) {
                isDisconnecting = true;
                disconnectDatabase();
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !isDisconnecting) {
                isDisconnecting = true;
                disconnectDatabase();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (!isDisconnecting) {
                isDisconnecting = true;
                disconnectDatabase();
            }
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [disconnectDatabase]);

    return null;
}