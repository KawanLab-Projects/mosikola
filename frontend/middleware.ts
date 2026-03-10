import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tolol.org'

async function verifyToken(token: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/auth/verifyToken`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Generous timeout for middleware
            signal: AbortSignal.timeout(5000),
        })
        return res.ok
    } catch {
        return false
    }
}

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Quick format check first — avoid network call if obviously invalid
    const looksLikeToken = !!token &&
        token.length > 10 &&
        token.includes('|') &&
        token !== 'undefined' &&
        token !== 'null'

    // Protected routes: verify token is actually valid
    if (pathname.startsWith('/dashboard')) {
        if (!looksLikeToken) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
        const valid = await verifyToken(token!)
        if (!valid) {
            // Clear the stale cookie and redirect
            const response = NextResponse.redirect(new URL('/auth/login', request.url))
            response.cookies.delete('token')
            return response
        }
    }

    // Auth routes: verify token before redirecting away from login
    if (pathname.startsWith('/auth')) {
        if (looksLikeToken) {
            const valid = await verifyToken(token!)
            if (valid) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
            // Token is stale — let them through to login and clear cookie
            const response = NextResponse.next()
            response.cookies.delete('token')
            return response
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth/:path*'],
}
