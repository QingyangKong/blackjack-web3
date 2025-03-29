'use client'
import { useEffect, useState } from "react"

export default function Page() { 
  const suits = ['♠️', '♥️', '♦️', '♣️']
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  const initialDeck = suits.map(suit => ranks.map(rank => ({suit: suit, rank: rank}))).flat()

  
  const [winner, setWinner] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [deck, setDeck] = useState<{suit: string, rank: string}[]>([])

  useEffect(() => {
    setWinner("player")
    setMessage("Player win! black jack!")
    setDeck(initialDeck)
  }, [])

  return (
    <div className="flex flex-col items-center h-screen bg-gray-400">
      <h1 className="my-4 text-4xl bold">Welcome the black jack game!!</h1>
      <h2 className={
        `my-4 text-2xl bold
        ${winner === "player" ? "bg-green-500" : "bg-yellow-500"}`
      }>{message}</h2>
      <div>
        dealer hand:
        <div className="flex flex-row gap-2">
          {
            deck.length === 0 ? <></> : deck.slice(0,3).map((card, index) => 
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
            deck.length === 0 ? <></> : deck.slice(0,3).map((card, index) => 
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
        <button className="p-1 bg-amber-300 rounded-lg"> hit </button>
        <button className="p-1 bg-amber-300 rounded-lg"> stand </button>
        <button className="p-1 bg-amber-300 rounded-lg"> reset </button>
      </div>
    </div>
  )
}