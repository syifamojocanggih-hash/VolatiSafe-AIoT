/** @type {import('next').NextConfig} */
const nextConfig = {
  // Polling sengaja tidak dipakai: di Windows host, poll 1 detik membuat webpack
  // terus menganggap file berubah, Fast Refresh jalan terus, dan WebSocket
  // dashboard ikut terputus tiap detik. Polling hanya perlu untuk bind mount Docker.
  reactStrictMode: true,
};

export default nextConfig;
