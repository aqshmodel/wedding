import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'https://wedding.aqsh.co.jp/api';
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'https://wedding.aqsh.co.jp';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const getStorageUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}${path}`;
};

export default api;

// Preload and Cache Utilities
export const mediaCache: {
  data: any | null;
  promise: Promise<any> | null;
} = {
  data: null,
  promise: null,
};

export const fetchMediaWithCache = async () => {
  if (mediaCache.promise) {
    return mediaCache.promise;
  }
  mediaCache.promise = api.get('/media').then(res => {
    mediaCache.data = res.data;
    // 最新10件の画像をプリロード
    const images = res.data.filter((m: any) => m.type === 'image');
    images.slice(0, 10).forEach((media: any) => {
      const url = getStorageUrl(media.thumbnail_path || media.file_path);
      const img = new Image();
      img.src = url;
    });
    return res.data;
  }).catch(err => {
    mediaCache.promise = null;
    throw err;
  });
  return mediaCache.promise;
};
