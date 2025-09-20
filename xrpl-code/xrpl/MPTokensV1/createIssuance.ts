 import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function createIssuance(tokenName : string, tokenTicker : string) {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
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
      tfMPTCanEscrow : true,
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
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  const tokenName = process.argv[2]
  const tokenTicker = process.argv[3]

  if (!tokenName || !tokenTicker) {
    console.error("❌ Usage: npx ts-node createIssuance.ts <TokenName> <TokenTicker>")
    process.exit(1)
  }

  createIssuance(tokenName, tokenTicker).catch(e => {
    console.error(e)
    process.exit(1)
  })
}