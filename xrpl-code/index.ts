import { Client, Payment, TrustSet, Wallet } from 'xrpl';
// const xrpl = require('xrpl');


// -------------------- Credential 관리 --------------------
interface Credential {
  address: string;
  role: 'admin' | 'user';
  kycCompleted: boolean;
}

const credentials: Record<string, Credential> = {};

function registerUser(address: string, role: 'admin' | 'user', kyc: boolean) {
  credentials[address] = { address, role, kycCompleted: kyc };
  console.log(`User ${address} registered. KYC: ${kyc}`);
}

function canAccessDEX(address: string): boolean {
  const cred = credentials[address];
  return !!cred && cred.kycCompleted && cred.role === 'user';
}

function canSendToken(address: string): boolean {
  const cred = credentials[address];
  return !!cred && cred.kycCompleted && cred.role === 'user';
}

// -------------------- XRPL 연결 --------------------
async function connectXRPL(): Promise<Client> {
    const client = new Client('wss://xrp-testnet.g.allthatnode.com/full/json_rpc/ef840d70622e4980964b0101a7758d18');
    await client.connect();
    return client;
}

// -------------------- PermissionedDEX: Token Swap --------------------
async function swapTokens(
  client: Client,
  wallet: Wallet,
  fromToken: string,
  toToken: string,
  amount: string,
  recipient: string,
  issuerMap: Record<string, string>
) {
  if (!canAccessDEX(wallet.address)) throw new Error("DEX access denied or KYC incomplete.");
// .models.transactions.TrustSet
  // Trustline 설정
  for (let token of [fromToken, toToken]) {
    const trustTx:TrustSet={
      TransactionType: "TrustSet",
      Account: wallet.address,
      LimitAmount: {
        currency: token,
        issuer: issuerMap[token],
        value: '1000000',
      },
    };
    await client.submitAndWait(trustTx, { wallet });
  }

  // 토큰 전송
  const paymentTx:Payment = {
    TransactionType: "Payment",
    Account: wallet.address,
    Destination: recipient,
    Amount: {
      currency: fromToken,
      value: amount,
      issuer: issuerMap[fromToken],
    },
  };
  const result = await client.submitAndWait(paymentTx, { wallet });
  console.log(`Swapped ${amount} ${fromToken} → ${toToken} to ${recipient}`);
  console.log(result);
}

// -------------------- Token Escrow --------------------
interface Escrow {
  token: string;
  amount: string;
  beneficiary: string;
  released: boolean;
}

const escrows: Escrow[] = [];

function createEscrow(token: string, amount: string, beneficiary: string) {
  escrows.push({ token, amount, beneficiary, released: false });
  console.log(`Escrow created for ${amount} ${token} to ${beneficiary}`);
}

function releaseEscrow(index: number, condition: boolean) {
  const escrow = escrows[index];
  if (!escrow) throw new Error("Escrow not found");
  if (condition && !escrow.released) {
    escrow.released = true;
    console.log(`${escrow.amount} ${escrow.token} released to ${escrow.beneficiary}`);
  } else {
    console.log("Condition not met or already released");
  }
}

// -------------------- Batch Token Transfer --------------------
interface Tx {
  from: string;
  to: string;
  token: string;
  amount: string;
}

async function batchTransfer(client: Client, wallet: Wallet, txs: Tx[], issuerMap: Record<string, string>) {
  for (const tx of txs) {
    if (!canSendToken(tx.from)) {
      console.log(`Skipping ${tx.from} -> ${tx.to}, permission denied`);
      continue;
    }
    const paymentTx:Payment = {
      TransactionType: "Payment",
      Account: wallet.address,
      Destination: tx.to,
      Amount: {
        currency: tx.token,
        value: tx.amount,
        issuer: issuerMap[tx.token],
      },
    };
    await client.submitAndWait(paymentTx, { wallet });
    console.log(`Batch transferred ${tx.amount} ${tx.token} from ${tx.from} to ${tx.to}`);
  }
}

// -------------------- 테스트 실행 --------------------
async function main() {
    
    // const client = new xrpl.Client('wss://xrp-testnet.g.allthatnode.com/full/json_rpc/ef840d70622e4980964b0101a7758d18');
  const client = await connectXRPL();

  // 지갑 생성 및 펀딩
  const wallet = Wallet.generate();
  await client.fundWallet(wallet);

  // Credential 등록
  registerUser(wallet.address, 'user', true);

  // 수신자 지갑
  const recipient = Wallet.generate();

  // 발행자 주소 매핑
  const issuerMap = {
    USDC: 'rUSDCissuerAddressHere',
    RLUSD: 'rRLUSDissuerAddressHere',
  };

  // 1️⃣ PermissionedDEX Token Swap
  await swapTokens(client, wallet, 'USDC', 'RLUSD', '50', recipient.address, issuerMap);

  // 2️⃣ Token Escrow 생성 및 조건부 방출
  createEscrow('USDC', '30', recipient.address);
  releaseEscrow(0, true);

  // 3️⃣ Batch Token Transfer
  const batchTxs: Tx[] = [
    { from: wallet.address, to: recipient.address, token: 'USDC', amount: '10' },
    { from: wallet.address, to: recipient.address, token: 'RLUSD', amount: '20' },
  ];
  await batchTransfer(client, wallet, batchTxs, issuerMap);

  await client.disconnect();
}

main().catch(console.error);
