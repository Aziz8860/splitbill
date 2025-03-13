/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-82883d82197c4cc285ec8697d8b2c602.r2.dev',
        pathname: '/splitbill/**',
      },
    ],
  },
};

export default nextConfig;
