import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service'; // DB 접근용 서비스
import { Wallet, Client, Transaction } from 'xrpl';
import * as bcrypt from 'bcrypt';
import { SendBatchMptDto } from './dto/send-mpt.dto';
const crypto = require('crypto');

@Injectable()
export class MptokenService {
  constructor(
    private readonly db: DatabaseService,
  ) { }

  // private readonly client = new Client(process.env.NEXT_PUBLIC_NODE_WS || 'wss://s.altnet.rippletest.net:51233');
  async getBalanceOfMpts(userId: string) {
    const wallet = await this.findWalletByUserId(userId)
    const client = new Client("wss://s.devnet.rippletest.net:51233")
    await client.connect()

    try {
      // 계정이 가진 모든 MPToken 객체 조회
      const response = await client.request({
        command: "account_objects",
        account: wallet.address,
        ledger_index: "validated",
        type: "mptoken"
      })

      const mptTokens = response.result.account_objects

      if (!mptTokens || mptTokens.length === 0) {
        console.log("해당 계정에 MPT 없음")
        return { address: wallet.address, mpts: [] }
      }

      console.log(mptTokens);

      // IssuanceID와 Balance만 추출
      const mpts = mptTokens.map((token: any) => ({
        issuanceId: token.MPTokenIssuanceID,
        balance: token.MPTAmount,
        name: null,
        ticker: null
      }))

      // DB에서 IssuanceID 기반으로 토큰 이름, 티커 조회
      const issuanceIds = mptTokens.map((t: any) => t.MPTokenIssuanceID)
      const query = `
        SELECT issuance_id, name, ticker
        FROM mptokens
        WHERE issuance_id = ANY($1)
      `
      const dbResult = await this.db.query(query, [issuanceIds])
      const issuanceMap: Record<string, { name: string; ticker: string }> = {}
      dbResult.rows.forEach(row => {
        issuanceMap[row.issuance_id] = { name: row.name, ticker: row.ticker }
      })

      // 잔액 + 토큰 메타데이터 조합
      mpts.forEach(token => {
        token.name = issuanceMap[token.issuanceId]?.name ?? null
        token.ticker = issuanceMap[token.issuanceId]?.ticker ?? null
      })


      return {
        address: wallet.address,
        mpts
      }
    } catch (error) {
      console.error("❌ MPT 조회 실패:", error)
      return { address: wallet.address, mpts: [] }
    } finally {
      await client.disconnect()
    }
  }

  async getBalance(userSeed: string) {
    const wallet = Wallet.fromSeed(userSeed)
    const client = new Client("wss://s.devnet.rippletest.net:51233")
    await client.connect()
  
    try {
      // 1️⃣ 계정이 가진 모든 MPToken 객체 조회
      const response = await client.request({
        command: "account_objects",
        account: wallet.address,
        ledger_index: "validated",
        type: "mptoken"
      })
  
      const mptTokens = response.result.account_objects
  
      if (!mptTokens || mptTokens.length === 0) {
        console.log("해당 계정에 MPT 없음")
        return { address: wallet.address, mpts: [] }
      }
  
      // 2️⃣ DB에서 IssuanceID 기반으로 토큰 이름, 티커 조회
      const issuanceIds = mptTokens.map((t: any) => t.MPTokenIssuanceID)
      const query = `
        SELECT issuance_id, name, ticker 
        FROM mptokens 
        WHERE issuance_id = ANY($1)
      `
      const dbResult = await this.db.query(query, [issuanceIds])
      const issuanceMap: Record<string, { name: string; ticker: string }> = {}
      dbResult.rows.forEach(row => {
        issuanceMap[row.issuance_id] = { name: row.name, ticker: row.ticker }
      })
  
      // 3️⃣ 잔액 + 토큰 메타데이터 조합
      const mpts = mptTokens.map((token: any) => ({
        issuanceId: token.MPTokenIssuanceID,
        balance: token.MPTAmount || 0,
        name: issuanceMap[token.MPTokenIssuanceID]?.name ?? null,
        ticker: issuanceMap[token.MPTokenIssuanceID]?.ticker ?? null
      }))
  
      return {
        address: wallet.address,
        mpts
      }
    } catch (error) {
      console.error("❌ MPT 조회 실패:", error)
      return { address: wallet.address, mpts: [] }
    } finally {
      await client.disconnect()
    }
  }
  

  async createMptokens(userId: string, tokenName: string, tokenTicker: string) {
    try {
      // 1️⃣ 토큰 발행 및 IssuanceID 획득
      const issuanceId = await this.createIssuance(tokenName, tokenTicker)
  
      if (!issuanceId) {
        throw new Error("IssuanceID를 트랜잭션 결과에서 찾을 수 없음")
      }
  
      // 2️⃣ DB 저장
      await this.save(userId, tokenName, tokenTicker, issuanceId)
  
      console.log(`✅ MPT 생성 완료 | IssuanceID: ${issuanceId}`)
      return {
        userId,
        name: tokenName,
        ticker: tokenTicker,
        issuanceId
      }
    } catch (error) {
      console.error("❌ MPT 생성 실패:", error)
      throw error
    }
  }  
  
  async createIssuance(tokenName: string, tokenTicker: string) {
    const client = new Client("wss://s.devnet.rippletest.net:51233")
    await client.connect()

    const ADMIN_SEED = process.env.NEXT_PUBLIC_ADMIN_SEED
    if (!ADMIN_SEED) throw new Error("Missing env: ADMIN_SEED")
    const admin = Wallet.fromSeed(ADMIN_SEED)

    const metadata = {
      "name": tokenName,
      "ticker": tokenTicker
    }
    // 데모 기본값(필요시 바꿔도 됨)
    const tx: Transaction = {
      TransactionType: "MPTokenIssuanceCreate",
      Account: admin.address,
      AssetScale: 0,                            // 소수 0자리
      // MaximumAmount: "1000000000",             // 최대 발행량(옵션)
      Flags: {                                  // 정책 예시
        tfMPTCanTransfer: true,
        tfMPTCanEscrow: true,
        tfMPTRequireAuth: false
      },
      MPTokenMetadata: Buffer.from(JSON.stringify(metadata), "utf8").toString("hex")
      // MPTokenMetadata: "<hex-encoded string>" // 원하면 메타데이터(hex) 추가
    }

    try {
      const prepared = await client.autofill(tx)
      const signed = admin.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)

      console.log(JSON.stringify(result, null, 2))

      // CreatedNode 중 MPTokenIssuance의 IssuanceID(48hex) 출력
      const issuanceId48 = (result.result.meta as any)?.mpt_issuance_id
      if (issuanceId48) {
        console.log(`IssuanceID(created): ${issuanceId48}`)
      }
      return issuanceId48;
    } finally {
      await client.disconnect()
    }
  }

  async save(userId: string, name: string, ticker: string, issuanceId: string) {
    await this.db.query(
      'INSERT INTO mptokens (owner_id, name, ticker, issuance_id) VALUES ($1, $2, $3, $4)',
      [userId, name, ticker, issuanceId],
    );
  }

  /**
   * 사용자 MPT 수락(opt-in)
   */
  async authorizeMptoken(issuanceId: string, userId: string) {
    const client = new Client('wss://s.devnet.rippletest.net:51233');
    await client.connect();

    try {
      if (!issuanceId || !userId) throw new Error('IssuanceID와 userId 필요');

      const userSeed = await this.db.query(
        'SELECT seed FROM wallets WHERE user_id = $1 LIMIT 1',
        [userId],
      ).then(result => result.rows[0]?.seed);
      if (!userSeed) throw new Error('User wallet not found');

      const userWallet = Wallet.fromSeed(userSeed);

      const tx: Transaction = {
        TransactionType: 'MPTokenAuthorize',
        Account: userWallet.address,
        MPTokenIssuanceID: issuanceId,
      };

      const prepared = await client.autofill(tx);
      const signed = userWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      return result;
    } finally {
      await client.disconnect();
    }
  }

  async findWalletByUserId(userId: string) {
    const wallet = await this.db.query(
      'SELECT address, seed FROM wallets WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    return wallet.rows[0];
  }

  async sendBatchMpt(dto: SendBatchMptDto) {
    const client = new Client('wss://s.devnet.rippletest.net:51233')
    await client.connect()
    console.log(dto.reqUserSeed)
    //const sender = Wallet.fromSeed(dto.reqUserSeed)
    
    const ADMIN_SEED = process.env.NEXT_PUBLIC_ADMIN_SEED!
    const sender = Wallet.fromSeed(ADMIN_SEED)

    try {
      // 계정 시퀀스 조회
      console.log(sender.address)
      const ai = await client.request({ command: 'account_info', account: sender.address })
  
      const seq = ai.result.account_data.Sequence

      console.log(seq)
      // RawTransactions 배열 생성
      const rawTxs = await Promise.all(
        dto.transfers.map(async (t, idx) => {
          const toAddress = Wallet.fromSeed(t.toSeed).address; // Convert to address from seed
          
          // Construct individual transaction object
          return {
            TransactionType: 'Payment',
            Flags: 0x40000000, // tfFullyCanonicalSig
            Account: sender.address,
            Destination: toAddress,
            Amount: {
              mpt_issuance_id: dto.issuanceId,
              value: t.amount,
            },
            Sequence: seq + idx+1, // Increment sequence for each transaction
            Fee: '0', // You might want to set a dynamic fee here
            SigningPubKey: '', // Empty until signing
          };
        })
      );

      // Batch 트랜잭션 생성
      const batchTx: any = {
        TransactionType: 'Batch',
        Account: sender.address,
        Flags: 0x00080000, // Independent
        RawTransactions: rawTxs,
        Sequence: seq
      }

      const prepared = await client.autofill(batchTx)
      const signed = sender.sign(prepared)
      const result = await client.submitAndWait(signed.tx_blob)
      return result

    } finally {
      await client.disconnect()
    }
  }
}
