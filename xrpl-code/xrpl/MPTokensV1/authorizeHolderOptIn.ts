import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })


export async function authorizeHolder(issuanceId : string , userSeed : string) {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  // createIssuance 실행 로그에서 복사한 IssuanceID
const ISSUANCE_ID = issuanceId

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED  = userSeed
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const admin = Wallet.fromSeed(ADMIN_SEED)
  const user  = Wallet.fromSeed(USER_SEED)

  // const tx: Transaction = {
  //   TransactionType: "MPTokenAuthorize",
  //   Account: admin.address,
  //   MPTokenIssuanceID: ISSUANCE_ID,
  //   Holder: user.address
  //   //Flags: { tfMPTUnauthorize: true } // 해제하고 싶을 때만 사용
  // }
  
// Opt-in 할 때는 다음과 같이
const tx: Transaction = {
   TransactionType: "MPTokenAuthorize",
   Account: user.address,
   MPTokenIssuanceID: ISSUANCE_ID,
 }
  
  try {
    const prepared = await client.autofill(tx)
    const signed = user.sign(prepared) // 변경해서 사용!
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  const [,, issuanceId, userSeed] = process.argv
  if (!issuanceId || !userSeed) {
    console.error("Usage: ts-node authorizeHolder.ts <ISSUANCE_ID> <USER_SEED>")
    process.exit(1)
  }
  authorizeHolder(issuanceId, userSeed).catch(e => {
    console.error(e)
    process.exit(1)
  })
}