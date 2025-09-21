# DigitalBank


## 🚀 프로젝트 소개

저희 팀은 XRPL 기반 디지털 자산 관리 서비스 개발에 집중하며, Credential을 통해 사용자 경험 향상과 규제 준수를 동시에 실현하고, MPToken 기반 스테이블코인 관리 및 자동화된 금융 서비스를 제공합니다.

---

## 📽️ 데모 영상

👉 **[데모 영상 링크]**

- [크레덴셜 시연 영상](https://youtube.com/shorts/37RUpyahj9c?feature=share)
- [MPToken 확인 영상](https://youtube.com/shorts/lWwTjhlIWlU?feature=share)
---

## 🛠️ 기술 스택

- **백엔드**: NestJS, TypeScript, Node.js  
- **프론트엔드**: Next.js, React, TypeScript  
- **블록체인**: XRPL (Devnet)

---

## 🔗 프로젝트 구조

```bash

├── custodial-wallet-back/   # NestJS 기반 백엔드
│   ├── WALLET     
│   ├── MPTOKENS   
│   └── KYC        
├── custodial-wallet-front/  # Next.js 기반 지갑 프론트엔드
├── xrpl-code/               # XRPL 관련 스크립트 및 트랜잭션 로직
└── README.md

```

## 1️⃣ 설치 및 실행 방법

### 백엔드 실행
```bash
cd custodial-wallet-back
npm install
npm run start
```

### 프론트엔드 실행
```bash
cd custodial-wallet-front
npm install
npm run dev
```


## XRPL 활용 상세 설명

### 1. KYC 구현 (XRPL Credential)
- 사용자가 회원 가입 시 입력한 개인 정보(이름, 전화번호, 주소 등)를 **XRPL Credential**로 안전하게 저장  
- 개인 정보는 **해싱(Hashing)** 처리 후 온체인 기록  
- 관리자는 Credential 검증을 통해 사용자의 **KYC 인증 여부** 판별  

### 2. 토큰 발행 및 승인 (MPToken)
- 관리자가 **MPToken** 발행  
- 사용자가 XRPL 트랜잭션으로 해당 토큰을 **승인(Opt-in)**  

### 3. 관리자 일괄 토큰 전송(Batch)
- Batch 기능 활용, 일괄 토큰 전송
- 수수료 절약 가능

---


## API 목록 및 주요 기능
<img width="1087" height="682" alt="image" src="https://github.com/user-attachments/assets/142a3bc6-007a-48ca-8597-e7efe1e87f8e" />

### Auth Controller
- 사용자 계정 생성과 인증 담당
- JWT 기반 로그인 제공

### Wallet Controller
- XRPL 기반 지갑 생성 및 관리
- 트랜잭션 생성, 서명, 전송 기능 등 제공


### KYC Controller
- XRPL Credential을 활용한 KYC 관리

### MPToken Controller
- MPToken 관리
- 발행, 조회, 일괄 전송 기능 등 제공


---


## 🖼️ UI 스크린샷

### 회원가입 및 로그인
<img width="623" height="794" alt="회원가입" src="https://github.com/user-attachments/assets/c83e1689-e76f-4992-8280-cfadbb6b274e" />  
<img width="634" height="732" alt="로그인" src="https://github.com/user-attachments/assets/554ae65c-c2bc-4872-ba37-1e067349904f" />

### KYC 인증
<img width="600" alt="KYC 인증" src="https://github.com/user-attachments/assets/812b5a6d-75da-46b7-b479-8add48fbf3a1" />

### 지갑 생성
<img width="600" alt="지갑 생성" src="https://github.com/user-attachments/assets/c1541256-9683-4a28-aeed-5c5a1537cd2f" />


---

## 🌐 XRPL 블록 익스플로러 트랜잭션 링크
아래 링크를 통해 실제 XRPL에 기록된 트랜잭션 내역을 확인할 수 있습니다.
- **Credential 발급**: [D75C7FEB69FE59E2F0A2887A349BD25FF918B4CBDC897BA6EEE17F7972FD26A7](https://devnet.xrpl.org/transactions/D75C7FEB69FE59E2F0A2887A349BD25FF918B4CBDC897BA6EEE17F7972FD26A7)  
- **Credential 승인**: [C219CC03100C117137DC644E279BCF93082A2C07BF961804B85B50696A502232](https://devnet.xrpl.org/transactions/C219CC03100C117137DC644E279BCF93082A2C07BF961804B85B50696A502232)  
- **MPToken 발행 (MPTokenIssuanceCreate)**: [6555DDD23F031AEC44E74A5E5E0D070A9EB4BF1A4641EC22E360141E5BB8FA46](https://devnet.xrpl.org/transactions/6555DDD23F031AEC44E74A5E5E0D070A9EB4BF1A4641EC22E360141E5BB8FA46)  
- **MPToken 승인 (MPTokenAuthorize)**: [EACCC08BE7EE9A67C17875D89491234A2AF06AA5B1295B072422476B3FD59C57](https://devnet.xrpl.org/transactions/EACCC08BE7EE9A67C17875D89491234A2AF06AA5B1295B072422476B3FD59C57)  
- **MPToken 배치 전송 (Batch)**: [20DB95E6B108ABCC787A0D41821BBAF6B2C51625FA626101915515879C325081](https://devnet.xrpl.org/transactions/20DB95E6B108ABCC787A0D41821BBAF6B2C51625FA626101915515879C325081)
