import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service'; // DB 접근용 서비스
import { Wallet, Client, Transaction } from 'xrpl';
import * as bcrypt from 'bcrypt';
const crypto = require('crypto');

@Injectable()
export class WalletService {
  constructor(
    private readonly db: DatabaseService,
  ) {}

  // private readonly client = new Client(process.env.NEXT_PUBLIC_NODE_WS || 'wss://s.altnet.rippletest.net:51233');

  async createWallet(userId: string) {
    const client = new Client(process.env.NEXT_PUBLIC_NODE_WS);
    await client.connect();
    // 지갑 생성
    const wallet = Wallet.generate();    
    await client.fundWallet(wallet);
    const address = wallet.classicAddress;
    const privateKey = wallet.privateKey;
    const pubkey = wallet.publicKey;

    console.log('Generated wallet address:', address);
    console.log('Generated wallet private key:', privateKey);
    console.log('Generated wallet public key:', pubkey);

    //privateKey bcypt로 암호화
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const encryptPrivateKey = `${iv.toString('hex')}:${encrypted}`;
    console.log('Encrypted private key:', encryptPrivateKey);

    // DB에 저장
    await this.save(userId, address, encryptPrivateKey, pubkey);

    return {address};
  }

  async signTransaction(userId: string, tx: Transaction) {
    const walletData = await this.findWalletByUserId(userId);
    if (!walletData) {
      throw new Error('Wallet not found for user');
    }
    
    const { address, private_key } = walletData;
    const decryptedPrivateKey = await bcrypt.decrypt(private_key);
    
    const wallet = Wallet.fromSeed(decryptedPrivateKey);
    console.log('Signing transaction with wallet address:', address);
    
    // // 예시 트랜잭션 (XRP 송금)
    // const transaction = {
    //   TransactionType: 'Payment',
    //   Account: address,
    //   Destination: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe', // 예시 수신 주소
    //   Amount: '1000000', // 1 XRP (1 XRP = 1,000,000 drops)
    // };
    
    // 트랜잭션 서명
    const signedTx = wallet.sign(tx);
    console.log('Signed transaction:', signedTx);
    return signedTx;
  }

  async sendTransaction(tx_blob: string) {
    const client = new Client(process.env.NEXT_PUBLIC_NODE_WS);
    await client.connect();
    const result = await client.submitAndWait(tx_blob);
    console.log('Transaction result:', result);
    await client.disconnect();
    return result;
  }


  async save(userId: string, address: string, privateKey: string, pubkey: string) {
    await this.db.query(
      'INSERT INTO wallets (user_id, address, private_key, public_key) VALUES ($1, $2, $3, $4)',
      [userId, address, privateKey, pubkey],
    );
  }

  async findWalletByUserId(userId: string) {
    const wallet = await this.db.query(
      'SELECT address, public_key FROM wallets WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    return wallet.rows[0];
  }
}
