import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const password = process.env.APP_PASSWORD;

  // Check if the request is for an API route
  if (req.nextUrl.pathname.startsWith('/api')) {
    const authHeader = req.headers.get('authorization');

    if (authHeader === password) {
      return NextResponse.next();
    }

    return new NextResponse('Unauthorized', { status: 401 });
  } 

  // Handle frontend requests
  const pw = searchParams.get('pw');

  if (pw === password) {
    return NextResponse.next();
  }

  return new NextResponse('Unauthorized', { status: 401 });
}

// Apply middleware to web app and api endpoints
export const config = {
    matcher: ['/api/:path*', '/'],
};
