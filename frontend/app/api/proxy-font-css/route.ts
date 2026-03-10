import { NextRequest, NextResponse } from 'next/server'

// Proxy Google Fonts CSS and convert all woff2 font URLs to base64 data URIs
// so dom-to-image can use them without cross-origin issues
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const fontFamily = searchParams.get('family') || 'Poppins'
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontFamily}:ital,wght@0,400;0,700;1,400;1,700&display=swap`

    try {
        // Fetch the CSS from Google Fonts with a browser-like User-Agent
        const cssResponse = await fetch(googleFontsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        if (!cssResponse.ok) {
            return NextResponse.json({ error: 'Failed to fetch font CSS' }, { status: 502 })
        }

        let css = await cssResponse.text()

        // Find all woff2 URLs in the CSS and replace them with base64 data URIs
        const fontUrlRegex = /url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/g
        const matches = [...css.matchAll(fontUrlRegex)]

        // Fetch all font files in parallel
        const fontDataMap = new Map<string, string>()
        await Promise.all(
            matches.map(async (match) => {
                const fontUrl = match[1]
                if (!fontDataMap.has(fontUrl)) {
                    try {
                        const fontResponse = await fetch(fontUrl)
                        const fontBuffer = await fontResponse.arrayBuffer()
                        const base64 = Buffer.from(fontBuffer).toString('base64')
                        fontDataMap.set(fontUrl, `data:font/woff2;base64,${base64}`)
                    } catch {
                        // Keep original URL if fetch fails
                        fontDataMap.set(fontUrl, fontUrl)
                    }
                }
            })
        )

        // Replace all font URLs with base64 data URIs
        css = css.replace(fontUrlRegex, (match, url) => {
            const base64 = fontDataMap.get(url)
            return base64 ? `url(${base64})` : match
        })

        return new NextResponse(css, {
            headers: {
                'Content-Type': 'text/css',
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            }
        })
    } catch (error) {
        console.error('Error proxying font CSS:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
