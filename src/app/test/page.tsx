'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
    const [data, setData] = useState<any[]>([]); // ใช้ any[] แทนการใช้ interface
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/test');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const jsonData = await response.json();
                setData(jsonData);
                console.log('Results:', jsonData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    return (
        <div>
            <h1>Usernames:</h1>
            <ul>
                {data.map((user, index) => (
                    <li key={index}>{user.Password}</li>
                ))}
            </ul>
        </div>
    );
}
