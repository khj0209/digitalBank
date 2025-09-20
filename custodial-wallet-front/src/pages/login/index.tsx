import React, { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/axios';
import '../../styles/App.css'; // 스타일 파일 import

// Wallet Login 화면면
export default function LoginPage() {
  const router = useRouter();
  const { redirect_uri } = router.query as { redirect_uri?: string };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (redirect_uri) {
      console.log('Redirect URI:', redirect_uri);
      try {
        const url = new URL(redirect_uri);
        // allowlist 예시
        const allowedOrigins = ['*'];
        // if (!allowedOrigins.includes(url.origin)) {
        //   setError('허용되지 않은 redirect_uri 입니다.');
        // }
      } catch {
        setError('잘못된 redirect_uri 형식입니다.');
      }
    }
  }, [redirect_uri]);

  const handleLogin = async () => {
    try {
      // 입력값 검증
      const res = await api.post('/auth/login', {
        username,
        password,
      });
      const { jwt } = res.data;
      // localStorage에 JWT 저장
      localStorage.setItem('jwt', jwt);
      localStorage.setItem('userId', res.data.user.id);
      
      // account 정보를 세션 스토리지에 저장
      console.log('Login Success:', res.data);
      if(res.data.wallet){
        sessionStorage.setItem("account", res.data.wallet.address);      
      }
      else{
        sessionStorage.setItem("account", "");
      }

      // KYC 미완료 시 KYC 페이지로 강제 이동
      if(res.data.user.is_kyc === false){ 
        router.push('/kyc');
      }
      // Redirect URI가 없다면 기본 페이지로 이동
      router.push('/wallet');

    } catch (err: any) {
      console.error(err);
      setError('로그인 실패: ' + (err.response?.data?.message || 'Unknown Error'));
    }
  };

  // 로그인 화면 구성
  // 1. 사용자 이름과 비밀번호 입력 필드
  // 2. 로그인 버튼
  // 3. 로그인 실패 시 에러 메시지 표시
  return (
        <div className="login-bg">
      <div className="login-container">
        <h2 className="login-title">DigitalBanking 로그인</h2>
        <div className="login-field">
          <label className="login-label" htmlFor="username">
            아이디
          </label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="login-input"
            autoComplete="username"
          />
        </div>
        <div className="login-field">
          <label className="login-label" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="login-input"
            autoComplete="current-password"
          />
        </div>
        <button
          onClick={handleLogin}
          className="login-btn"
        >
          로그인
        </button>
        {error && (
          <div className="login-error">{error}</div>
        )}
      </div>
    </div>
    // <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
    //   <h2>로그인</h2>
    //   <input
    //     type="text"
    //     placeholder="Username"
    //     value={username}
    //     onChange={e => setUsername(e.target.value)}
    //     style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
    //   />
    //   <input
    //     type="password"
    //     placeholder="Password"
    //     value={password}
    //     onChange={e => setPassword(e.target.value)}
    //     style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
    //   />
    //   <button onClick={handleLogin} style={{ width: '100%', padding: '10px' }}>
    //     로그인
    //   </button>
    //   {error && <div style={{ marginTop: '10px', color: 'red' }}>{error}</div>}
    // </div>
  );
}
