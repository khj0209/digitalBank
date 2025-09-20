import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL, // 환경변수로 설정
  withCredentials: true, // 세션 쿠키 전달하려면 필요
});

export default api;
