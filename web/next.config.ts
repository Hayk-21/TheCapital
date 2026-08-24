import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 — нативный модуль, его нельзя бандлить.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  // Значок Next.js в углу — только для разработки, на сайте он лишний.
  // Вернуть: убрать эту строку.
  devIndicators: false,
  images: {
    // Загруженные картинки лежат локально в /public/uploads.
    // При переезде на облачное хранилище сюда добавятся remotePatterns.
    formats: ["image/webp"],
  },
};

export default nextConfig;
