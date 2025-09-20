import { useEffect, useState } from "react";
import "../../styles/App.css";
import api from "../../lib/axios";
import { Client } from 'xrpl';

interface Chain {
  name: string;
  symbol: string;
  rpcUrl: string;
}

export default function WalletService() {
  const chains = [
    { name: "XRPL Testnet", symbol: "XRP", rpcUrl: process.env.NEXT_PUBLIC_TEST_NODE_RPC, clientUrl: process.env.NEXT_PUBLIC_TEST_NODE_WS },
    { name: "XRPL Mainnet", symbol: "XRP", rpcUrl: process.env.NEXT_PUBLIC_MAIN_NODE_RPC, clientUrl: process.env.NEXT_PUBLIC_MAIN_NODE_WS },
  ];  
  const [client, setClient] = useState<Client | null>(chains[0].clientUrl ? new Client(chains[0].clientUrl) : null);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [mpts, setMpts] = useState<any[]>([]);
  const [isWallet, setIsWallet] = useState(false);
  const [to, setTo] = useState<string>("");
  const [value, setValue] = useState('');
  const [selectedChain, setSelectedChain] = useState<string>("XRPL-testnet"); // 선택된 체인 상태
  const [selectedChainSymbol, setSelectedChainSymbol] = useState<string>("XRP"); // 선택된 체인 심볼 상태

  

  const getBalance = async () => {
    const address = sessionStorage.getItem("account") || "";
    if(address === "") {
      console.log("지갑 주소가 없습니다. 지갑을 생성해주세요.");
      return;
    }
    // 자산 내역 조회
    try {
      await client?.connect();
      const response = await client?.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });
      const bal = response?.result?.account_data?.Balance;
      console.log(`Account: ${address}, Balance: ${bal} drops`);
      // XRP 잔고는 drops 단위이므로, XRP 단위로 변환
      setBalance(bal ? (parseInt(bal) / 1000000).toString() : "0");
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }

  const getBalanceMpts = async () => {
    const address = sessionStorage.getItem("account") || "";
    if(address === "") {
      console.log("지갑 주소가 없습니다. 지갑을 생성해주세요.");
      return;
    }
    // 자산 내역 조회
    try {
      const res = await api.post('/mptoken/get', {
        userId: localStorage.getItem("userId"),
        // userSeed: localStorage.getItem("userSeed"),
      });
      console.log('MPT Balance:', res.data);
      // setBalance(bal ? (parseInt(bal) / 1000000).toString() : "0");
      setMpts(res.data.mpts || []);

    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }

  useEffect(() => {
    setAccount(sessionStorage.getItem("account") || "");
    if(account!==""){
      setIsWallet(true);
      getBalance();
      getBalanceMpts();
    }
  },[account]);

  const handleChainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedChain(selected);
    const chain = chains.find((chain) => chain.name === selected);
    if (chain) {
      setClient(chain.clientUrl ? new Client(chain.clientUrl) : null);
      setSelectedChainSymbol(chain.symbol);
      console.log(`Switched to ${chain.name} with RPC ${chain.rpcUrl}`);
      // 선택된 체인에 맞게 잔고 다시 조회
      getBalance();
    }
  };

  // 지갑 생성 함수수
  const createWallet = async () => {
    //header에 jwt 토큰 추가
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      alert("로그인이 필요합니다.");
      window.location.replace("/login");
      return;
    }
    api.defaults.headers.common['Authorization'] = jwt;
    const { data } = await api.post("/wallet/create");
    sessionStorage.setItem("account", data.address);
    setAccount(data.address);
  };

  const sendTx = async () => {
    try {
      const response = await api.post('/tx/send', {
        from: account,
        to,
        value,
      });
      console.log('Tx Hash:', response.data.txHash);
      alert(`트랜잭션 전송 완료: ${response.data.txHash}`);
    } catch (err) {
      console.error(err);
    }
  };

  const swapToken = async () => {
  }
  // 주소 복사 함수
  const copyAddress = () => {
    const address = sessionStorage.getItem("account") || "";
    navigator.clipboard.writeText(address).then(() => {
      alert("주소가 복사되었습니다.");
    }).catch((err) => {
      console.error("주소 복사 실패:", err);
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <div className="absolute top-4 left-4">
          <select
            value={selectedChain}
            onChange={handleChainChange}
            className="wallet-chain-select"
            style={{ minWidth: 80, maxWidth: 120 }}
          >
            {chains.map((chain) => (
              <option key={chain.name} value={chain.name}>
                {chain.name}
              </option>
            ))}
          </select>
        </div> */}
        <div className="wallet-box">
          {isWallet ? (
            <div>
              <div className="wallet-account-row">
                <p className="wallet-account">
                  Account: {account.slice(0, 6) + '...' + account.slice(-4)}
                </p>
                <button
                  onClick={copyAddress}
                  className="wallet-copy-btn"
                  title="주소 복사"
                >
                  <img src="/copy.png" alt="복사" width={28} height={28} />
                </button>
              </div>
              <div>
              <button onClick={sendTx} className="wallet-btn">
                  +
                </button>
                </div>
                <div className="wallet-mpts">
                  {mpts.map((mpt, index) => (
                  <div
                    key={index}
                    className="wallet-mpt-item"
                    style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "10px",
                    marginBottom: "10px",
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <p className="wallet-account">
                    {mpt.name}
                    </p>
                    <p className="wallet-account">
                    Balance:
                    {mpt.balance || 0} {mpt.ticker}
                    </p>
                    <div>
                      {/* <input
                        type="text"
                        placeholder="수량"
                        className="wallet-input"
                        onChange={(e) => setValue(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="보낼주소"
                        className="wallet-input"
                        onChange={(e) => setTo(e.target.value)}
                      /> */}
                      <button onClick={sendTx} className="wallet-btn">
                        전송
                      </button>
                      <button onClick={swapToken} className="wallet-input">
                        교환
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
            </div>
          ) : (
            <button onClick={createWallet} className="wallet-create-btn">
              Wallet 생성
            </button>
          )}
        </div>
      </header>
    </div>
  );
}
