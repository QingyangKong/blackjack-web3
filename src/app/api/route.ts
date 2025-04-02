// save the score into the database
// get and put score with tables in database
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { verifyMessage } from "viem";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({ 
    region: "us-east-1", 
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
    }
})
const docClient = DynamoDBDocumentClient.from(client)

interface DynamoItem {
    player: string;
    score: number
}

async function putItem(item: DynamoItem) {
    try {
        const command = new PutCommand({
            TableName: "BlackJack",
            Item: item
        })
        await docClient.send(command)
    } catch (error) {
        throw new Error("Error putting item in DynamoDB: " + error)
    }
}
async function getItem(player: string) {
    try {
        const command = new GetCommand({
            TableName: "BlackJack",
            Key: {
                player
            }
        })
        const resposne = await docClient.send(command)
        return resposne.Item as DynamoItem || null
    } catch (error) {
        throw new Error("Error getting item from DynamoDB: " + error)
    }
}

async function updateScoreForPlayer(player: string, score: number) {
    try {
        const item = await getItem(player)
        if(!item) {
            await putItem({player, score})
        } else {
            await putItem({player, score})
        }
    } catch (error) {
        throw new Error("Error updating score for player: " + error)
    }
}

// Start the game and get 2 random cards for dealer and player
// handle the hit and stand and decide who is the winner

const suits = ['♠️', '♥️', '♦️', '♣️']
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
const initialDeck = suits.map(suit => ranks.map(rank => ({suit: suit, rank: rank}))).flat()

export interface Card {
    suit: string;
    rank: string;
}

const gameState: {
    dealerHand: Card[],
    playerHand: Card[],
    deck: Card[],
    message: string,
    score: number
} = {
    dealerHand: [],
    playerHand: [],
    deck: initialDeck,
    message: "",
    score: 0
}

function getRandomCard(deck: Card[], noOfCards: number): [Card[], Card[]] {
    const randomeIndexSet = new Set<number>()
    while(randomeIndexSet.size < noOfCards) {
        const randomIndex = Math.floor(Math.random() * deck.length)
        randomeIndexSet.add(randomIndex)
    }

    const randomCards = deck.filter((_, index) => randomeIndexSet.has(index))
    const newDeck = deck.filter((_, index) => !randomeIndexSet.has(index))
    return [randomCards, newDeck]
}

export async function GET(request: Request) {
    const url = new URL(request.url)
    const player = url.searchParams.get("player")
    if(!player) {
        return new Response(JSON.stringify({message: "Player is required"}), {
            status: 400 
    })}

    gameState.deck = [...initialDeck]
    gameState.dealerHand = []
    gameState.playerHand = []
    gameState.message = ""

    const [dealerHand, deckAfterDealer] = getRandomCard(gameState.deck, 2)
    const [playerHand, deckAfterPlayer] = getRandomCard(deckAfterDealer, 2)

    gameState.dealerHand = dealerHand
    gameState.playerHand = playerHand
    gameState.deck = deckAfterPlayer

    const response = await getItem(player)
    if(!response) {
        gameState.score = 0
    } else {
        gameState.score = response.score
    }
    
    return new Response(JSON.stringify({
        playerHand: gameState.playerHand,
        dealerHand: [gameState.dealerHand[0], {suit: "?", rank: "?"} as Card],
        message: gameState.message,
        score: gameState.score
    }), {
        status: 200
    })
}

// handle the hit and stand and decide who is the winner
export async function POST(request: Request) {
    try {
        // return if the action is not hit or stand
        const body = await request.json()
        const { action, player } = body

        // verify if the signaure is correct
        if(action === "auth") {
            const { signature, message } = body
            const isValid = await verifyMessage({
                address: player,
                signature,
                message
            })
            if(isValid) {
                const jwtToken = jwt.sign({player}, process.env.JWT_SECRET || "", {expiresIn: "1h"})
                return new Response(JSON.stringify({"token": jwtToken}), {
                    status: 200
                })
            } else {
                return new Response(JSON.stringify({message: "Signaure is invalid"}), {
                    status: 400
                })
            }
        }

        // verify that every request has a valid token
        const header = request.headers.get("Bearer")
        if(!header || !header.startsWith("Bearer ")) {
            return new Response(JSON.stringify({message: "Unauthorized"}), {
                status: 401
            })
        }
        const jwtToken = header.split(" ")[1]
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || "") as {player: string}
        if(decoded.player.toLocaleLowerCase() !== player.toLocaleLowerCase()) {
            return new Response(JSON.stringify({message: "Unauthorized"}), {
                status: 401
            })
        }

        // return if the current game is finished
        if(gameState.message !== "") {
            return new Response(JSON.stringify({
                playerHand: gameState.playerHand,
                dealerHand: gameState.dealerHand,
                message: gameState.message    
            }), {
                status: 200
            })
        } 

        // return if the action is not hit or stand
        if(action !== "hit" && action !== "stand") {
            return new Response(JSON.stringify({message: "Invalid action"}), {
                status: 400
            })
        }
        

        // hit: 21 - player wins black jack
        // hit: greater than 21 - player loses, bust
        // hit: less than 21 = continue, update the player hand
        if(action === "hit") {
            
            const [newCard, newDeck] = getRandomCard(gameState.deck, 1)
            gameState.playerHand.push(...newCard)
            gameState.deck = newDeck

            const playerValue = calculateHandValue(gameState.playerHand)
            if(playerValue > 21) {
                gameState.message = "You lose! busts!"
                gameState.score -= 100
            }
            else if(playerValue === 21) {
                gameState.message = "You win! Black Jack!"
                gameState.score += 100
            }
        }

        else if(action === "stand") {
            let dealerValue = calculateHandValue(gameState.dealerHand)
            while(dealerValue < 17) {
                const [newCard, newDeck] = getRandomCard(gameState.deck, 1)
                gameState.dealerHand.push(...newCard)
                gameState.deck = newDeck
                dealerValue = calculateHandValue(gameState.dealerHand)
            }

            const playerValue = calculateHandValue(gameState.playerHand)
            // stand: 21 - dealer wins, black jack
            // stand: greate than 21 - player win, dealer bust
            // stand: less than 21 - 
                // dealer hand > player hand: dealer wins
                // dealer hand < player hand: player wins
                // dealer hand = player hand : draw 

            if(dealerValue > 21) {
                gameState.message = "You win! Dealer busts!"
                gameState.score += 100
            } else if(dealerValue === 21) {
                gameState.message = "You lose! Black Jack!"
                gameState.score -= 100
            } else {
                if(dealerValue > playerValue) {
                    gameState.message = "You lose"
                    gameState.score -= 100
                } else if(dealerValue < playerValue) {
                    gameState.message = "You win"
                    gameState.score += 100
                } else {
                    gameState.message = "Draw!"
                }
            }
        }

        await updateScoreForPlayer(player, gameState.score)        

        return new Response(JSON.stringify(
            {
                playerHand: gameState.playerHand,
                dealerHand: gameState.message !== "" ? gameState.dealerHand : [gameState.dealerHand[0], {suit: "?", rank: "?"} as Card],
                message: gameState.message,
                score: gameState.score
            }), {
            status: 200
        })
    } catch (error) {
        console.error("Error parsing request body:", error)
        return new Response(JSON.stringify({message: "Invalid request"}), {
            status: 400
        })
    }
}

function calculateHandValue(hand: Card[]): number {
    let value = 0
    let acesCount = 0
    hand.forEach(card => {
        if(card.rank === "A") {
            acesCount++
            value += 11
        }
        else if(card.rank === "J" || card.rank === "Q" || card.rank === "K") {
            value += 10
        }
        else {
             value += parseInt(card.rank)
        }
    })

    while(value > 21 && acesCount > 0) {
        value -= 10
        acesCount--
    }
    return value
}