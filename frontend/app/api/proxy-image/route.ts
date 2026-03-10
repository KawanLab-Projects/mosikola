import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    if (!url.startsWith('http')) {
        return new NextResponse('Invalid URL parameter. Must be absolute.', { status: 400 });
    }

    try {
        console.log(`[Proxy] Fetching image from: ${url}`);

        // Add a timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mosikola-Proxy/1.0',
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`[Proxy] Failed to fetch image. Status: ${response.status} ${response.statusText} URL: ${url}`);
            return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
        }

        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        console.log(`[Proxy] Success! Type: ${contentType}, Size: ${blob.size} bytes`);

        return new NextResponse(blob, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            },
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error(`[Proxy] Timeout fetching image: ${url}`);
            return new NextResponse('Request Timeout', { status: 504 });
        }
        console.error('[Proxy] Image proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
