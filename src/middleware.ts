import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the hostname from the request headers
  const hostname = request.headers.get('host');

  // Check if the visit is coming through the default Vercel domain
  if (hostname === 'asstudio.vercel.app') {
    // Clone the current URL so we can preserve the exact path and parameters
    const url = request.nextUrl.clone();
    
    // Update the URL to your custom domain
    url.hostname = 'asstudio.com.ng';
    url.port = ''; // Ensure no port is appended
    url.protocol = 'https:'; // Force HTTPS

    // Return a 308 Permanent Redirect (better for SEO than 301)
    return NextResponse.redirect(url, 308);
  }

  // If the host is already correct, continue as normal
  return NextResponse.next();
}

// Optimize the middleware to run only on necessary paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
