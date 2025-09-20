import React, { useState, useEffect, FormEvent, use, useRef } from 'react';
import api from '@/lib/axios';
import '../../../styles/App.css'; // 스타일 파일 import

export default function CustomSignPage() {
    const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const [Data, setData] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [signedTx, setSignedTx] = useState<string>('');
    const unsignedTx = useRef({
        to: '',
        data: '',
    });
    
    // 팝업으로 열렸을 때 부모창에서 to, data 값을 받아오는 로직
    useEffect(() => {
        console.log('[Wallet] 팝업 로딩 완료, App에게 READY 전송');
        window.opener?.postMessage({ type: 'WALLET_READY' }, APP_ORIGIN);
    }, []);
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            // 필요시 origin 체크 추가
            if (event.data?.type === 'SIGN_REQUEST') {
                if (event.data.payload?.to) setTo(event.data.payload.to);
                if (event.data.payload?.data) setData(event.data.payload.data);
                if (event.data.payload?.address) {
                    sessionStorage.setItem("account", event.data.payload.address);
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const confirmAndSend = async () => {
        unsignedTx.current = {
            to: to,
            data: Data,
        };
        const address = sessionStorage.getItem("account") || "";

        try {
            // 서명 요청
            const res = await api.post('/sign/simple', {
                unsignedTx: unsignedTx.current,
                address: address,
            });
            // 서명된 트랜잭션을 상태에 저장
            setSignedTx(res.data);
            console.log('서명된 트랜잭션:', res.data);

        } catch (err) {
            console.error('❌ 트랜잭션 실패:', err);
            alert('트랜잭션 실패');
        }
    };

    return (
        <div className="sign-bg">
            <div className="sign-container">
                <h2 className="sign-title">커스텀 트랜잭션 서명</h2>
                <div className="sign-field">
                    <label className="sign-label" htmlFor="to">To</label>
                    <input
                        id="to"
                        type="text"
                        placeholder="To"
                        className="sign-input"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                    />
                </div>
                <div className="sign-field">
                    <label className="sign-label" htmlFor="data">Data</label>
                    <input
                        id="data"
                        type="text"
                        placeholder="Data"
                        className="sign-input"
                        value={Data}
                        onChange={(e) => setData(e.target.value)}
                    />
                </div>
                <button onClick={confirmAndSend} className="sign-btn">
                    서명 요청
                </button>
                <div className="sign-field">
                    <label className="sign-label">서명 결과</label>
                    <pre className="sign-tx-view">
                        {signedTx ? JSON.stringify(signedTx, null, 2) : '대기 중...'}
                    </pre>
                </div>
            </div>
        </div>
    );
}
