// src/constants/config.ts
export const config = {
    api: {
      baseUrl: __DEV__ ? 'http://localhost:5000/api' : 'https://your-api.com/api',
      timeout: 10000,
    },
    cache: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    audio: {
      maxDownloads: 50,
      downloadQuality: '128k',
    },
  };