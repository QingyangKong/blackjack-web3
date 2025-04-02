# Step 4
In the step 3, we have stored players' score in dynamoDB for long term, but there is no login for the game. For a web3 game, it is necessary for users to login the game with their wallet. The UX is allow users to sign a message with their wallet to certify that the the user is the one who holds the private key. 

So in the step 4, we are going to：
- Add wallet login for users.
- Use address as ID to save the users' scores in DB. 


1. Import Rainbowkit wallet<br>
Install the wallet with command
```shell
pnpm add @rainbow-me/rainbowkit
```

2. Add rainbow provider in wagmi provider file<br>
Add the lines to src/api/providers.tsx
```ts
import '@rainbow-me/rainbowkit/styles.css';

import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
```
Use the rainbow provider with `QueryClientProvider` like below
```tsx
return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {props.children}      
          </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
```

3. Add ConnectButton at front-end<br>
```tsx
import { ConnectButton } from "@rainbow-me/rainbowkit"
...
<ConnectButton />
```
After the button added, you can see use the button to connect to the website like below:
![alt text](/imagesForReadme/ui-7.png)

If the wallet is connected(it will connect your wallet if you once connectec the wallet to the rainbowk kit), info is displayed on the page. UI is provided as below to sign with message. 
![alt text](/imagesForReadme/ui-8.png)

Once the message is signed with wallet, the gaming page will be displayed. 
![alt text](/imagesForReadme/ui-9.png)

4. Block the game if player does not sign<br>

For now, although there is button in the page, players can still play the game even if they does not connect and sign. Add a state `signed` to mark if the user signs the message or not. 

5. Add verification logics in back-end
install jsonwebtoken with command
```shell
pnpm add jsonwebtoken @types/jsonwebtoken
```
Add a secret key in `.env.local`, you can create a key with command
```shell
openssl rand -hex 32
```
Save the generated secret key in `.env.local`<br>

Add a new option `auth` in the `POST()` in route file, verify the signaure and grant a token if the request is valid. <br>

Add a verification to check if the jsonwebtoken is provided when the POST and GET requests are made. 

6. Use address as primary key in DB<br>

Add address of the player in the request from front-end, when the request arrives back-end, it will be used as primary key in DB. Replace the "default_plqyer" we used in last step.
