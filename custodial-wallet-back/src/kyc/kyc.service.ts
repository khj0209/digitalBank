import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt'; // 비밀번호 암호화할거면 필요
import { hash } from "crypto";
import { create } from "domain";
import { DatabaseService } from "src/database/database.service";
import { WalletService } from "src/wallet/wallet.service";
import { Client, CredentialCreate, Transaction, Wallet } from 'xrpl';

@Injectable()
export class KycService {
    constructor(
        private readonly db: DatabaseService,
        private readonly walletService: WalletService,
    ) {} // DB 연결 객체 주입

    async registerKyc(userId: string, name: string, phoneNumber: string, homeAddress: string) {
        // KYC 등록 로직 구현
        const hashedKYC = await bcrypt.hash(name + phoneNumber + homeAddress, 10);
        const res = await this.db.query(
            'INSERT INTO kycs (user_id, name, phone_number, home_address, hash) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
            [userId, name, phoneNumber, homeAddress, hashedKYC],
          ).then(result => result.rows[0]);
        if(!res) throw new Error('KYC registration failed');

        const req = await this.createCredentialRequest(userId, hashedKYC);

        const accept = await this.acceptCredential(userId);

        this.db.query(
            'UPDATE users SET is_kyc = true WHERE id = $1',
            [userId],
        );
        
        return { res };
    }
    async createCredentialRequest(userId: string, hashedKYC: string) {
        const toHex = (s: string) => Buffer.from(s, "utf8").toString("hex")//hex 인코딩 함수
        const now = () => Math.floor(Date.now()/1000)

        const userAddress = await this.db.query(
            'SELECT address FROM wallets WHERE user_id = $1 LIMIT 1',
            [userId], // 임시로 userId 1번 유저의 주소를 가져옴
        ).then(result => result.rows[0].address);
        console.log("User address:", userAddress)
        if(!userAddress) throw new Error("User wallet not found");

        const issuer = await this.db.query(
            'SELECT address FROM wallets WHERE user_id = $1 LIMIT 1',
            [process.env.ADMIN_USER_ID], // 발급자 지갑 주소 (userId 1번 유저의 주소를 가져옴)
        ).then(result => result.rows[0]);
        console.log("Issuer address:", issuer)
        if(!issuer) throw new Error("Issuer wallet not found");
        
        const tx: CredentialCreate = {
            TransactionType: "CredentialCreate",
            Account: issuer.address,                  // 발급자(서명자)
            Subject: userAddress,                 // 피발급자
            CredentialType: toHex(hashedKYC),             // "KYC" → hex
            Expiration: now() + 86400,                 // 1년 후 만료
            URI: toHex("https://example.com/credentials/kyc/user")
        }

        const client = new Client(process.env.NEXT_PUBLIC_NODE_WS);
        await client.connect()
        // client.fundWallet(Wallet.fromSeed(process.env.ADMIN_SEED || '')); // 발급자 지갑에 XRP 충전
    
        const prepared = await client.autofill(tx)
        // const signed   = issuer.sign(prepared)       // ✅ 발급자 서명
        const signed = await this.walletService.signTransaction(process.env.ADMIN_USER_ID, prepared);
        const res = await client.submitAndWait(signed.tx_blob)

        console.log(res);
        await client.disconnect()
    }

    async acceptCredential(userId: string) {
        const toHex = (s: string) => Buffer.from(s, "utf8").toString("hex")
        const client = new Client(process.env.NEXT_PUBLIC_NODE_WS);
        await client.connect()

         const issuerAddress = await this.db.query(
            'SELECT address FROM wallets WHERE user_id = $1 LIMIT 1',
            [process.env.ADMIN_USER_ID], // 발급자 지갑 주소 (userId 1번 유저의 주소를 가져옴)
        ).then(result => result.rows[0]);
        console.log("Issuer address:", issuerAddress)
        if(!issuerAddress) throw new Error("Issuer wallet not found");

        const userAddress = await this.db.query(
            'SELECT address FROM wallets WHERE user_id = $1 LIMIT 1',
            [userId], // 임시로 userId 1번 유저의 주소를 가져옴
        ).then(result => result.rows[0].address);
        console.log("User address:", userAddress)
        if(!userAddress) throw new Error("User wallet not found");

        const subject = await this.db.query(
            'SELECT seed FROM wallets WHERE user_id = $1 LIMIT 1',
            [userId], // 임시로 userId 1번 유저의 주소를 가져옴
        ).then(result => result.rows[0]);
        console.log("User seed:", subject)
        if(!subject) throw new Error("User wallet not found");

        const tx: Transaction = {
            TransactionType: "CredentialAccept",
            Account: userAddress,                 // ✅ 피발급자 서명/전송
            Issuer: issuerAddress.address,
            CredentialType: toHex(toHex("KYC_TEST1"), ),             // createCredential.ts와 동일
        }
      
        const prepared = await client.autofill(tx)
        const signed   = Wallet.fromSeed(subject.seed).sign(prepared)
        const result   = await client.submitAndWait(signed.tx_blob)
        await client.disconnect()
        
        console.log(result);
        return result
    }
    
}