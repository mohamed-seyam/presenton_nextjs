
const nextConfig = {
  reactStrictMode: false,
  distDir: ".next-build",
  

  // Rewrites for development - proxy API requests to FastAPI backend
  async rewrites() {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/app_data/fonts/:path*',
        destination: `${BACKEND_URL}/app_data/fonts/:path*`,
      },
      {
        source: '/app_data/images/:path*',
        destination: `${BACKEND_URL}/app_data/images/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${BACKEND_URL}/static/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-7c765f3726084c52bcd5d180d51f1255.r2.dev",
      },
      {
        protocol: "https",
        hostname: "pptgen-public.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pptgen-public.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "img.icons8.com",
      },
      {
        protocol: "https",
        hostname: "present-for-me.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "yefhrkuqbjcblofdcpnr.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
    ],
  },
  
};

export default nextConfig;
