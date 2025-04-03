'use client'
import { useEffect, useState } from "react"
import { Card } from "./api/route"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useSignMessage } from "wagmi"
import { createWalletClient, createPublicClient, custom, parseAbi  } from "viem"
import { avalancheFuji } from "viem/chains"

export default function Page() { 
  
  const [message, setMessage] = useState<string>("")
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [score, setScore] = useState<number>(0)
  const [signed, setSigned] = useState<boolean>(false)
  const { isConnected, address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [walletClient, setWalletClient] = useState<any>(null) // 动态初始化
  const [publicClient, setPublicClient] = useState<any>(null) // 动态初始化

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
      body: JSON.stringify({action: "hit", player: address})
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
      body: JSON.stringify({action: "stand", player: address})
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

    if(response.status === 200) {
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
      
      if(!contractAddr || !contractAbi) {
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

  if(!signed) {
    return (
      <div>
        <ConnectButton />
        {
          isConnected ? <button onClick={handleSign} className="bg-slate-400 rounded-md p-2"> Please Sign</button> : <h1> Please Connect</h1>
        }
        
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center h-screen bg-gray-400">
      <ConnectButton />
      <h1 className="my-4 text-4xl bold">Welcome the black jack game!!</h1>
      <div>
        <h1 className="my-4 text-4xl bold">Score: {score}</h1>
        <button onClick={handleSendTx} className="p-1 bg-amber-300 rounded-lg"> Get Token </button>
      </div>
      <h2 className={
        `my-4 text-2xl bold
        ${message.includes("win") ? "bg-green-500" : "bg-yellow-500"}`
      }>{message}</h2>
      <div>
        dealer hand:
        <div className="flex flex-row gap-2">
          {
            dealerHand.length === 0 ? <></> : dealerHand.map((card, index) => 
              <div className="h-42 w-28 border-black border-1 flex flex-col justify-between rounded-sm bg-white" key={index}>
                <h2 className="self-start text-2xl pt-3 pl-3">{card.rank}</h2>
                <h2 className="self-center text-3xl">{card.suit}</h2>
                <h2 className="self-end text-2xl pb-3 pr-3">{card.rank}</h2>
              </div>
            )
          }
        </div>
      </div>

      <div>
        Player hand hand:
        <div className="flex flex-row gap-2">
          {
            playerHand.length === 0 ? <></> : playerHand.map((card, index) => 
              <div className="h-42 w-28 border-black border-1 flex flex-col justify-between rounded-sm bg-white" key={index}>
                <h2 className="self-start text-2xl pt-3 pl-3">{card.rank}</h2>
                <h2 className="self-center text-3xl">{card.suit}</h2>
                <h2 className="self-end text-2xl pb-3 pr-3">{card.rank}</h2>
              </div>
            )
          }
        </div>
      </div>
      <div className="flex flex-row gap-2 mt-4">
        {
          message !== "" ? <button onClick={handleReset} className="p-1 bg-amber-300 rounded-lg"> reset </button>
          :
          <>
            <button onClick={handleHit} className="p-1 bg-amber-300 rounded-lg"> hit </button>
            <button onClick={handleStand} className="p-1 bg-amber-300 rounded-lg"> stand </button>
          </>
        }
       </div>
    </div>
  )
}