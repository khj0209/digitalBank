import dotenv from "dotenv"
import path from "path"
import { Client, Wallet } from "xrpl"

dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function getMPTBalances() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  try {
    const userSeed = process.env.USER_SEED
    if (!userSeed) throw new Error("환경변수 USER_SEED 필요")

    const userWallet = Wallet.fromSeed(userSeed)
    const account = userWallet.address

    // 계정이 가진 모든 MPToken 객체 조회
    const response = await client.request({
        command: "account_objects",
        account,
        ledger_index: "validated",
        type: "mptoken"
      })

    const mptTokens = response.result.account_objects

    if (!mptTokens || mptTokens.length === 0) {
      console.log("해당 계정에 MPT 없음")
      return
    }

    console.log(`📌 ${account}가 가진 MPT 총 ${mptTokens.length}개`)
    mptTokens.forEach((token: any, i: number) => {
      console.log(
        `[${i + 1}] IssuanceID: ${token.MPTokenIssuanceID}, Balance: ${token.MPTAmount}`
      )
    })

  } catch (error) {
    console.error("❌ MPT 조회 실패:", error)
  } finally {
    await client.disconnect()
    console.log("🔄 연결 종료")
  }
}

if (require.main === module) {
  getMPTBalances()
}
