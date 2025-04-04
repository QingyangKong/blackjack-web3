'use client'
import { useEffect, useState } from "react"
import { Card } from "./api/route"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useSignMessage } from "wagmi"
import { createWalletClient, createPublicClient, custom, parseAbi } from "viem"
import { avalancheFuji } from "viem/chains"

export default function Page() {
  const [message, setMessage] = useState<string>("")
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [score, setScore] = useState<number>(0)
  const [signed, setSigned] = useState<boolean>(false)
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [walletClient, setWalletClient] = useState<any>(null)
  const [publicClient, setPublicClient] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const wallet = createWalletClient({
        chain: avalancheFuji,
        transport: custom(window.ethereum)
      })
      const publicC = createPublicClient({
        chain: avalancheFuji,
        transport: custom(window.ethereum)
      })
      setWalletClient(() => wallet)
      setPublicClient(() => publicC)
    } else {
      console.error("MetaMask or window.ethereum is not available")
    }
  }, [])

  const initialGame = async () => {
    const response = await fetch(`/api?player=${address}`, {
      method: "GET",
    })
    const result = await response.json()
    setPlayerHand(result.playerHand)
    setDealerHand(result.dealerHand)
    setScore(result.score)
  }

  async function handleHit() {
    const response = await fetch("api", {
      headers: {
        bearer: `Bearer ${localStorage.getItem("token")}`,
      },
      method: "POST",
      body: JSON.stringify({ action: "hit", player: address })
    })
    const { playerHand, dealerHand, message, score } = await response.json()
    setPlayerHand(playerHand)
    setDealerHand(dealerHand)
    setMessage(message)
    setScore(score)
  }

  async function handleStand() {
    const response = await fetch("api", {
      headers: {
        bearer: `Bearer ${localStorage.getItem("token")}`,
      },
      method: "POST",
      body: JSON.stringify({ action: "stand", player: address })
    })
    const { playerHand, dealerHand, message, score } = await response.json()
    setPlayerHand(playerHand)
    setDealerHand(dealerHand)
    setMessage(message)
    setScore(score)
  }

  async function handleReset() {
    const response = await fetch(`api?player=${address}`, {
      headers: {
        bearer: `Bearer ${localStorage.getItem("token")}`,
      },
      method: "GET",
    })

    const { playerHand, dealerHand, message, score } = await response.json()
    setPlayerHand(playerHand)
    setDealerHand(dealerHand)
    setMessage(message)
    setScore(score)
  }

  async function handleSign() {
    const messageToSign = `Welcome to the black jack game at ${new Date().toString()}, please sign this message to prove you are the owner of the wallet.`
    const signature = await signMessageAsync({
      message: messageToSign
    })
    const response = await fetch("/api", {
      method: "POST",
      body: JSON.stringify({
        signature,
        message: messageToSign,
        player: address,
        action: "auth"
      })
    })

    if (response.status === 200) {
      const { token } = await response.json()
      localStorage.setItem("token", token)
      setSigned(true)
      setMessage("")
      initialGame()
    }
  }

  async function handleSendTx() {
    try {
      const contractAddr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      const contractAbiRaw = process.env.NEXT_PUBLIC_CONTRACT_ABI || ""

      let contractAbi;

      try {
        contractAbi = parseAbi([contractAbiRaw])
        console.log("Parsed ABI:", contractAbi)
      } catch (error) {
        console.error("Error parsing ABI:", error)
        setMessage("Invalid ABI JSON format")
        return
      }

      if (!contractAddr || !contractAbi) {
        console.error("Contract address or ABI is not defined")
        return
      }
      const args = [address]

      const { request } = await publicClient.simulateContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: 'sendRequest',
        args: [
          args,
          address
        ],
        account: address
      })

      const txHash = await walletClient.writeContract({
        address: contractAddr as `0x${string}`,
        abi: contractAbi,
        functionName: 'sendRequest',
        args: [
          args,
          address
        ],
        account: address
      })
    } catch (error) {
      console.error("Error sending transaction:", error)
    }
  }

  // Helper function to determine card color
  const getCardColor = (suit: string) => {
    return suit === '♥️' || suit === '♦️' ? 'text-red-600' : 'text-black';
  };

  if (!signed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 flex flex-col items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 shadow-2xl border border-white/20 w-full max-w-md">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Crypto Blackjack</h1>
          <div className="flex flex-col items-center gap-6">
            <div className="w-full">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  return (
                    <div
                      className="w-full"
                      {...(!mounted && {
                        'aria-hidden': true,
                        'style': {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!mounted || !account || !chain) {
                          return (
                            <button
                              onClick={openConnectModal}
                              type="button"
                              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
                            >
                              Connect Wallet
                            </button>
                          );
                        }
                        
                        return (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={openChainModal}
                              className="flex items-center gap-2 bg-gray-800/50 py-2 px-4 rounded-lg text-white text-sm"
                            >
                              {chain.name}
                            </button>
                            
                            <button 
                              onClick={openAccountModal}
                              className="flex items-center gap-2 bg-gray-800/50 py-2 px-4 rounded-lg text-white text-sm"
                            >
                              {account.displayName}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
            
            {isConnected && (
              <button 
                onClick={handleSign}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
              >
                Sign & Play
              </button>
            )}
            
            {!isConnected && (
              <p className="text-white text-center">Please connect your wallet to play</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 flex flex-col items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik0xMCAxMGgyMHYyMGgtMjB6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-10 pointer-events-none"></div>
      
      {/* Header area */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6 z-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
          <span className="text-amber-400">Crypto</span> Blackjack
        </h1>
        <ConnectButton />
      </div>
      
      {/* Score and tokens area */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-6xl mb-6 z-10">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 flex-1 border border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl">Chips</h2>
            <span className="text-2xl font-bold text-amber-400">{score}</span>
          </div>
        </div>
        
        <button 
          onClick={handleSendTx} 
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
        >
          Get Tokens
        </button>
      </div>
      
      {/* Game message */}
      {message && (
        <div className={`w-full max-w-6xl mb-6 p-4 rounded-lg text-center font-bold text-xl z-10 animate-bounce
          ${message.includes("win") ? "bg-green-600 text-white" : 
            message.includes("lose") ? "bg-red-600 text-white" : 
            message.includes("Draw") ? "bg-blue-600 text-white" : "bg-yellow-500 text-white"}`}
        >
          {message}
        </div>
      )}
      
      {/* Game table */}
      <div className="w-full max-w-6xl bg-green-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-green-700 mb-8 z-10">
        {/* Dealer's cards */}
        <div className="mb-8">
          <h2 className="text-white text-xl mb-4 font-bold">Dealer's Hand</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {dealerHand.length === 0 ? (
              <div className="h-40 w-28 bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center">No cards</p>
              </div>
            ) : (
              dealerHand.map((card, index) => (
                <div 
                  key={index}
                  className={`h-40 w-28 bg-white rounded-lg shadow-xl border border-gray-300 flex flex-col justify-between p-2 transform transition-transform duration-300 hover:scale-105 ${
                    card.suit === "?" ? "bg-gradient-to-br from-red-900 to-red-800 border-red-700" : ""
                  }`}
                >
                  {card.suit === "?" ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-white text-4xl">?</span>
                    </div>
                  ) : (
                    <>
                      <div className={`self-start text-2xl font-bold ${getCardColor(card.suit)}`}>
                        {card.rank}
                      </div>
                      <div className={`self-center text-4xl ${getCardColor(card.suit)}`}>
                        {card.suit}
                      </div>
                      <div className={`self-end text-2xl font-bold rotate-180 ${getCardColor(card.suit)}`}>
                        {card.rank}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Player's cards */}
        <div className="mb-8">
          <h2 className="text-white text-xl mb-4 font-bold">Your Hand</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {playerHand.length === 0 ? (
              <div className="h-40 w-28 bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center">No cards</p>
              </div>
            ) : (
              playerHand.map((card, index) => (
                <div 
                  key={index}
                  className="h-40 w-28 bg-white rounded-lg shadow-xl border border-gray-300 flex flex-col justify-between p-2 transform transition-transform duration-300 hover:scale-105"
                >
                  <div className={`self-start text-2xl font-bold ${getCardColor(card.suit)}`}>
                    {card.rank}
                  </div>
                  <div className={`self-center text-4xl ${getCardColor(card.suit)}`}>
                    {card.suit}
                  </div>
                  <div className={`self-end text-2xl font-bold rotate-180 ${getCardColor(card.suit)}`}>
                    {card.rank}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Game controls */}
      <div className="flex flex-wrap gap-4 justify-center z-10">
        {message !== "" ? (
          <button 
            onClick={handleReset} 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
          >
            New Game
          </button>
        ) : (
          <>
            <button 
              onClick={handleHit} 
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
            >
              Hit
            </button>
            <button 
              onClick={handleStand} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
            >
              Stand
            </button>
          </>
        )}
      </div>
    </div>
  )
}