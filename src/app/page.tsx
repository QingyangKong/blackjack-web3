'use client'
import { useEffect, useState } from "react"
import { Card } from "./api/route"

export default function Page() { 
  
  const [message, setMessage] = useState<string>("")
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [score, setScore] = useState<number>(0)

  useEffect(() => {
    setMessage("")
    const initialGame = async () => {
      const response = await fetch("/api", {
        method: "GET",
      })
      const result = await response.json()
      setPlayerHand(result.playerHand)
      setDealerHand(result.dealerHand)
      setScore(result.score)
    }
    initialGame()
  }, [])

  async function handleHit() {
    const response = await fetch("api", {
      method: "POST",
      body: JSON.stringify({action: "hit"})
    })
    const { playerHand, dealerHand, message, score } = await response.json()
    setPlayerHand(playerHand)
    setDealerHand(dealerHand)
    setMessage(message)
    setScore(score)
  }

  async function handleStand() {
    const response = await fetch("api", {
      method: "POST",
      body: JSON.stringify({action: "stand"})
    })
    const { playerHand, dealerHand, message, score } = await response.json()
    setPlayerHand(playerHand)
    setDealerHand(dealerHand)
    setMessage(message)
    setScore(score)
  }

  async function handleReset() {
    const response = await fetch("api", {
      method: "GET",
    })

    const { playerHand, dealerHand, message, score } = await response.json()
    setPlayerHand(playerHand)
    setDealerHand(dealerHand)
    setMessage(message)
    setScore(score)
  }

  return (
    <div className="flex flex-col items-center h-screen bg-gray-400">
      <h1 className="my-4 text-4xl bold">Welcome the black jack game!!</h1>
      <h1 className="my-4 text-4xl bold">Score: {score}</h1>
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