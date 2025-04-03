# Step 5
Merely logging with wallet does not define a app as dApp, because there is nothing tokenized so far. In this step, we will make users to mint an NFT when they make 1000 scores in the game. 

1. Create AWS lambda function<br>

If we want to fetch the data from table in dynamodb, we have to use the AWS dynamo SDK. We create a lambda function to help the external call to get the data without using SDK. <br>
In some cases, the SDK is not available, so we can allow users to call the data with API key in the traditional way. <br>
In the AWS, go the search bar and search "lambda" and go to the lambda functions. <br>
Click "Create functions" on the top right. Select "Author from scratch". In the Basic Information, name the lambda function as "getPlayers". Set the Runtime as Node.js 22.x. Leave other configurations as default. Click "Create function" finally. <br>

The lambda function created is show below:
![alt text](/imagesForReadme/ui-11.png)


2. Test the lambda function<br>

Go to the "configuration" -> "Function URL" -> "Create function URL" to create an URL for the lambda function that can be called externally. <br>
Select "None" for function permissions. and click "save". Function URL is created in function dashboard. 
![alt text](/imagesForReadme/ui-12.png)
Open the URL in the explorer and you will see the "Hello from lambda" as returned value. 

3. Develop the codes for AWS lambda function<br>
Go the code and input the following codes:
```js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1"
})
const ddbDocClient = DynamoDBDocumentClient.from(client);
const API_KEY = "112233qwe"

export const handler = async (event) => {
  try {
    // verify the api key
    if (event.headers?.["api-key"] !== API_KEY) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Unauthorized" })
      };
    }
    
    // get the necessary data from request
    const player = event.headers?.["player"];
    if (!player) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: event.headers })
      };
    }

    // contruct the data for getCommand
    const params = {
      TableName: "BlackJack",
      Key: {
        player: player
      }
    }

    const data = await ddbDocClient.send(new GetCommand(params))
    return {
      statusCode: 200, body: JSON.stringify(data.Item || {})
    }
  } catch(e) {
    return {
      statusCode: 500, body: JSON.stringify(e)
    }
  }
};

```
You can use KMS to save the API key but KMS is not free so we save the API key as constant in the lambda codes. The address of the user will be sent in GET request with attribute name: `player`. 

4. Grant permission the role of lambda function<br>

Go to "IAM" -> "Roles" and find the role that was automatically generated for lambda function. Click the role name and "Add permissions" -> "Attach Policies" -> "AmazonDyanmoDBFullAccess" -> "Add Permission" to grant the dynamoDB permission to the lambda function role.<br>

Go back to the lambda function and you can see permission is already added to the role like below:
![alt text](/imagesForReadme/ui-13.png)

5. Test with Chainlink Functions<br>

Go to the Chainlink Functions Playground and test if we can fetch the data with correct credentials. Paste codes to the playground:
```js
if(!secrets.apiKey) {
  throw Error("API key is not provided")
}

// fetch params from the request
const apiKey = secrets.apiKey;
const playerAddress = args[0]

// Execute the API request (Promise)
const apiResponse = await Functions.makeHttpRequest({
  url: `https://ao7dz5it5antkg6npd5gezptqu0qpkat.lambda-url.us-east-1.on.aws/`,
  method: "GET",
  headers: {
    "api-key": apiKey,
    "player": playerAddress
  }
})

if (apiResponse.error) {
  console.error(apiResponse.error)
  throw Error("Request failed")
}

const { data } = apiResponse;
if(!data.score) {
  console.error("the user does not exist")
  throw Error("Score does not exist, request failed")
}

return Functions.encodeUint256(data.score)
```
with the params as below:
![alt text](/imagesForReadme/ui-14.png)

click "Run code" to send the request. 

6. Develop and deploy smart contract<br>

In the smart contract, we will allow the user to mint a NFT if their scores are more than 1000. The contracts implement the Functions Client and ERC-721 smart contracts. You can find the contract in folder "contracts".

7. Create Chainlink Function subscription<br>

Create a subscription and fund the subscription with 10 LINKs. Add the address of deployed contract in last step as a consumer in the subscription. 

8. upload secret to DON<br>

use the script to upload the secret to DON so that Chainlink Functions can make the use of API key. <br>
Run the command: `pnpm add @chainlink/functions-toolkit ethers@5 dotenv` to install the dependencies and create file `uploadSecretToDon.js` under the root directory and copy the file from this [gist]() to the file. <br>
Add 3 environment variables in the `.env.local`<br>
```
ETHEREUM_PROVIDER_AVALANCHEFUJI=https://avax-fuji.g.alchemy.com/v2/xxx
AWS_API_KEY=xxx
EVM_PRIVATE_KEY=0x1234
```
Run the command `node uploadSecretToDON.js` to upload the secret. Secret version and slotId will be saved at same-level directory with the name donSecretInfo.txt. 

9. Create a button to send request<br> 

Create a function to `handleSendTransaction` to send transaction to the smart contract. To send transction, you need to have contract address, human readable abi of the function to be called and parameters of the transaction. <br>

Save the contract address and abi in .env.local like below:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x80fDc51cbe395fA18EcbD5577920f664084D7c1B
NEXT_PUBLIC_CONTRACT_ABI='function sendRequest(string[] memory args,address player) external returns (bytes32 requestId)'
```

Create a button and set `handleSendTransaction` as onclick attribute of the button. 

10. call function `setConfig` of the contract<br>

Gather the parameters like "SecretSlotId", "SerectVersionId" and "SubscriptionId" and call the function `setConfig` in remix with the paramters. If you want to make the config updated every day, Chainlink Automation is a useful tool to make it possible. 