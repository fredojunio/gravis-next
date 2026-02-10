
import React from 'react';
import { use } from 'react';

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return <div>Test Page ID: {id}</div>;
}
