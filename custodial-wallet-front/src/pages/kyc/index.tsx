import api from "@/lib/axios";
import { useState } from "react";
import '../../styles/App.css'; // 스타일 파일 import

export default function LoginPage() {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [homeAddress, setHomeAddress] = useState('');
    const [error, setError] = useState('');
    const handleKYC = async () => {
        try {
            // 입력값 검증
            const res = await api.post('/kyc/register', {
                userId: localStorage.getItem("userId"),
                name,
                phoneNumber,
                homeAddress
            });
            console.log('KYC Success:', res.data);
            alert("KYC 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.");
            window.location.href = "/wallet";
        } catch (err: any) {
            console.error(err);
            setError('KYC 실패: ' + (err.response?.data?.message || 'Unknown Error'));
        }
    };
    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="login-title">1Q Wallet KYC</h2>
                <div className="login-field">
                    <label className="login-label" htmlFor="username">
                        이름
                    </label>
                    <input
                        // id="username"
                        type="text"
                        placeholder="이름"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="login-input"
                        autoComplete="username"
                    />
                </div>
                <div className="login-field">
                    <label className="login-label" htmlFor="phoneNumber">
                        전화번호
                    </label>
                    <input
                        id="phoneNumber"
                        type="phone"
                        placeholder="전화번호"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="login-input"
                        autoComplete="current-password"
                    />
                </div>
                <div className="login-field">
                    <label className="login-label" htmlFor="homeAddress">
                        주소
                    </label>
                    <input
                        id="homeAddress"
                        type="text"
                        placeholder="주소"
                        value={homeAddress}
                        onChange={e => setHomeAddress(e.target.value)}
                        className="login-input"
                        autoComplete="current-password"
                    />
                </div>
                <button onClick={handleKYC} className="login-btn">
                    KYC 신청
                </button>
                {error && (
                <div className="login-error">{error}</div>
                )}
            </div>
        </div>
    );
}