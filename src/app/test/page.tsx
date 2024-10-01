// app/test/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface TestData {
    results: any[];
}

export default function TestPage() {
    const [data, setData] = useState<TestData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/test');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const jsonData: TestData = await response.json();
                setData(jsonData);
                console.log('Results:', jsonData.results);
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
    if (!data) return <div>No data available</div>;

    return (
        <div>
            <h1>Test Page</h1>
            <h2>Results:</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}