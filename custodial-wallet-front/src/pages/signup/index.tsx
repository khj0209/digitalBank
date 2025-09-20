import api from "@/lib/axios";
import { useState } from "react";
import '../../styles/App.css'; // 스타일 파일 import

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordCheck, setPasswordCheck] = useState('');
    const [error, setError] = useState('');
    const handleSignup = async () => {
        try {
            // 입력값 검증
            const res = await api.post('/auth/signup', {
                username,
                password,
                passwordCheck
            });
        } catch (err: any) {
            console.error(err);
            setError('로그인 실패: ' + (err.response?.data?.message || 'Unknown Error'));
        }
    };
    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="login-title">1Q Wallet 회원가입</h2>
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
                <div className="login-field">
                    <label className="login-label" htmlFor="passwordCheck">
                        비밀번호 확인
                    </label>
                    <input
                        id="passwordCheck"
                        type="password"
                        placeholder="passwordCheck"
                        value={passwordCheck}
                        onChange={e => setPasswordCheck(e.target.value)}
                        className="login-input"
                        autoComplete="current-password"
                    />
                </div>
                <button onClick={handleSignup} className="login-btn">
                    회원가입
                </button>
                {error && (
                <div className="login-error">{error}</div>
                )}
            </div>
        </div>
    );
}