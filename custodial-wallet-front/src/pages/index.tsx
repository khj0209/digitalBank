import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} flex flex-col items-center justify-center min-h-screen bg-gray-50`}
    >
      <div className="w-full max-w-4xl flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4">1Q Wallet</h1>
        <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl">
          1Q Wallet은 안전하고 간편한 디지털 자산 관리 서비스를 제공합니다. 
        </p>
        <div className="mb-8 w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-2">주요 페이지 안내</h2>
          <ul className="list-disc list-inside text-gray-800 space-y-1">
            <li>
              <span className="font-medium">메인 페이지 "/"</span>: 서비스 소개 및 주요 기능 안내
            </li>
            <li>
              <span className="font-medium">로그인 페이지 "/login"</span>: 계정 인증 및 지갑 접속
            </li>
            <li>
              <span className="font-medium">지갑 페이지 "/wallet"</span>: 자산 현황, 거래 내역, 송금/입금 기능 제공
            </li>
            <li>
              <span className="font-medium">서명 페이지 "/sign"</span>: Popup 화면으로 열렸을때 서명할 data를 받아 서명 Confirm을 받는 화면
            </li>
            <li>
              <span className="font-medium">수동 서명 페이지 "/sign/custom"</span>: 직접 서명할 DATA를 입력 받아 서명된 signed Tx를 받는 화면
            </li>
          </ul>
        </div>
        <a
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          로그인 페이지로 이동
        </a>
      </div>
    </div>
  );
}
