import { NextResponse } from 'next/server';

/**
 * Same-origin image proxy. Two jobs:
 *
 * 1. Cropper support — browsers taint a canvas when it draws a cross-origin
 *    image, which blocks `toBlob()`. Streaming the image through our own origin
 *    sidesteps any cross-origin / CORS dependency.
 * 2. Google Drive embedding — a Drive *share* link points at an HTML viewer
 *    page, not the image bytes, and Drive isn't in next.config's image hosts.
 *    Given a Drive file id we fetch the real bytes from Drive's thumbnail
 *    endpoint server-side and serve them from our own origin instead.
 *
 * Both modes only ever reach a fixed allow-list of hosts, so this can't be
 * used as an open proxy.
 */
const ALLOWED_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/petra-io-media/`;

/** Drive file ids are URL-safe base64-ish; reject anything else. */
const DRIVE_ID = /^[a-zA-Z0-9_-]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gdrive = searchParams.get('gdrive') ?? '';
  const url = searchParams.get('url') ?? '';

  let upstreamUrl: string;
  if (gdrive) {
    if (!DRIVE_ID.test(gdrive)) {
      return NextResponse.json({ error: 'Invalid Drive id.' }, { status: 400 });
    }
    // Drive's thumbnail endpoint reliably returns image bytes for any file
    // shared "Anyone with the link"; sz=w2000 caps width at a CMS-friendly size.
    upstreamUrl = `https://drive.google.com/thumbnail?id=${gdrive}&sz=w2000`;
  } else if (ALLOWED_PREFIX && url.startsWith(ALLOWED_PREFIX)) {
    upstreamUrl = url;
  } else {
    return NextResponse.json({ error: 'Disallowed source.' }, { status: 400 });
  }

  const upstream = await fetch(upstreamUrl, { cache: 'no-store', redirect: 'follow' });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Could not load image.' }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      // Drive images are immutable per id, so let them cache; bucket images stay private.
      'Cache-Control': gdrive ? 'public, max-age=86400' : 'private, no-store',
    },
  });
}
