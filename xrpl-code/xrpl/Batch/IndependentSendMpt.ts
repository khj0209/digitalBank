import dotenv from "dotenv"
import path from "path"
import { Client, Wallet } from "xrpl"
dotenv.config({ path: path.join(process.cwd(), ".env") })

interface MPTTransfer {
  issuanceId: string
  userSeed: string
  amount: string
}

export async function sendBatchMPT(transfers: MPTTransfer[]) {
  if (transfers.length === 0) throw new Error("전송할 항목이 없습니다")

  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED!
  const admin = Wallet.fromSeed(ADMIN_SEED)

  try {
    // Admin 계정의 시퀀스 조회
    const ai = await client.request({ command: "account_info", account: admin.address })
    const seq = ai.result.account_data.Sequence

    // RawTransactions 배열 생성
    const rawTxs = transfers.map((t, idx) => {
      const user = Wallet.fromSeed(t.userSeed)
      return {
        RawTransaction: {
          TransactionType: "Payment",
          Flags: 0x40000000, // tfFullyCanonicalSig
          Account: admin.address,
          Destination: user.address,
          Amount: {
            mpt_issuance_id: t.issuanceId,
            value: t.amount
          },
          Sequence: seq + idx + 1,
          Fee: "0",
          SigningPubKey: ""
        }
      }
    })

    const batchTx: any = {
      TransactionType: "Batch",
      Account: admin.address,
      Flags: 0x00080000, // Independent
      RawTransactions: rawTxs,
      Sequence: seq
    }

    const prepared = await client.autofill(batchTx)
    const signed = admin.sign(prepared)
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

// 사용 예시
if (require.main === module) {
  const transfers = [
    {
      issuanceId: "0060B3DDC66F32EA63421E5B16363F691BD44FB547A7FA35",
      userSeed: process.env.USER_SEED!,
      amount: "1000"
    },
    {
      issuanceId: "0060B3DDC66F32EA63421E5B16363F691BD44FB547A7FA35",
      userSeed: process.env.USER_SEED!,
      amount: "2000"
    }
  ]

  sendBatchMPT(transfers).catch(e => { console.error(e); process.exit(1) })
}
