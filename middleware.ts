import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // 세션 갱신 (토큰 만료 대응)
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/auth');
  const isPublic = isAuthPage;

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    // 원래 가려던 경로를 returnTo 파라미터로 저장
    if (path !== '/') url.searchParams.set('returnTo', path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const returnTo = request.nextUrl.searchParams.get('returnTo') ?? '/team';
    const url = request.nextUrl.clone();
    url.pathname = returnTo;
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
