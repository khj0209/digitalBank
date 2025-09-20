import React, { useState, useEffect, FormEvent, use } from 'react';
import api from '@/lib/axios';
import '../../styles/App.css'; // 스타일 파일 import

// 서명 페이지
// 이 페이지는 App에서 unsignedTx를 받아서 서명하고 트랜잭션 배포까지 진행 후 Receipt을 리턴턴
export default function SignPage() {
    const [unsignedTx, setUnsignedTx] = useState<any>(null);
    const [address, setAddress] = useState<string>("");

    const APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL;
    useEffect(() => {
        console.log('[Wallet] 팝업 로딩 완료, App에게 READY 전송');
        window.opener?.postMessage({ type: 'WALLET_READY' }, APP_ORIGIN);
    }, []);

    // 2. App → unsignedTx 수신
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.origin !== APP_ORIGIN) return;

            const { type, payload } = event.data;
            if (type === 'SIGN_REQUEST') {
                console.log('[🟢 지갑 서비스] unsignedTx 수신:', payload);
                setUnsignedTx(payload.unsignedTx);
                setAddress(payload.address);
            }
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    const confirmAndSend = async () => {
        if (!unsignedTx) return;

        try {
            // 서명 및 트랜잭션 배포
            const res = await api.post('/sign/tx', {
                unsignedTx: unsignedTx,
                address: address,
            });

            // 서명된 트랜잭션을 App에 전달
            window.opener?.postMessage(
                {
                    type: 'TX_RECEIPT',
                    payload: res.data,
                },
                APP_ORIGIN
            );

            window.close();
        } catch (err) {
            console.error('❌ 트랜잭션 실패:', err);
            alert('트랜잭션 실패');
        }
    };

    return (
        <div className="sign-bg">
            <div className="sign-container">
                <h2 className="sign-title">트랜잭션 서명</h2>
                <div className="sign-field">
                    <label className="sign-label">서명할 트랜잭션</label>
                    <pre className="sign-tx-view">
                        {unsignedTx ? JSON.stringify(unsignedTx, null, 2) : '대기 중...'}
                    </pre>
                </div>
                <button onClick={confirmAndSend} className="sign-btn">
                    서명 및 전송
                </button>
            </div>
        </div>
        // <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
        // <h2>서명해</h2>
        // <p>{unsignedTx ? JSON.stringify(unsignedTx, null, 2) : '대기 중...'}</p>
        // <button onClick={confirmAndSend} style={{ width: '100%', padding: '10px' }}>
        //     Confirm
        // </button>
        // </div>
    );
}
