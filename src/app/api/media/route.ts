import { NextResponse } from 'next/server';

/**
 * Same-origin image proxy for the editor's cropper. Browsers taint a canvas
 * when it draws a cross-origin image, which blocks `toBlob()`. Streaming the
 * image through our own origin sidesteps any cross-origin / CORS dependency on
 * Supabase storage entirely.
 *
 * Locked to our own public media bucket so this can't be used as an open proxy.
 */
const ALLOWED_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/petra-io-media/`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') ?? '';

  if (!ALLOWED_PREFIX || !url.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: 'Disallowed source.' }, { status: 400 });
  }

  const upstream = await fetch(url, { cache: 'no-store' });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Could not load image.' }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  });
}
