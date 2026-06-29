import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Node 24 + Next 14's bundled enhanced-resolve throws EISDIR on readlink for
    // regular files; skipping symlink resolution avoids that broken path.
    config.resolve.symlinks = false;
    return config;
  },
  images: {
    remotePatterns: [
      // Supabase Storage public buckets
      {
        protocol: 'https',
        hostname: 'nvwwkehglccokobxwelp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
