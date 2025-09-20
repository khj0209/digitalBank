import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

const toHex = (s: string) => Buffer.from(s, "utf8").toString("hex")

export async function acceptCredential(userSeed : string, credentialType : string) { 
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  const ADMIN_SEED = process.env.ADMIN_SEED
  const USER_SEED  = userSeed
  if (!ADMIN_SEED || !USER_SEED) throw new Error("Missing env: ADMIN_SEED, USER_SEED")

  const issuer  = Wallet.fromSeed(ADMIN_SEED)
  const subject = Wallet.fromSeed(USER_SEED) // ✅ 서명자 = 피발급자

  try {
    const tx: Transaction = {
      TransactionType: "CredentialAccept",
      Account: subject.address,                 // ✅ 피발급자 서명/전송
      Issuer: issuer.address,
      CredentialType: toHex(credentialType),             // createCredential.ts와 동일
    }

    const prepared = await client.autofill(tx)
    const signed   = subject.sign(prepared)
    const result   = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  const userSeed = process.argv[2] || process.env.USER_SEED
  const credentialType = process.argv[3] || process.env.CREDENTIAL_TYPE

  if (!userSeed) {
    console.error("❌ userSeed is required (arg or env)")
    process.exit(1)
  }
  if (!credentialType) {
    console.error("❌ credentialType is required (arg or env)")
    process.exit(1)
  }

  acceptCredential(userSeed, credentialType).catch(e => {
    console.error(e)
    process.exit(1)
  })
}