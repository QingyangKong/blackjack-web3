import { SecretsManager } from "@chainlink/functions-toolkit";
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({path: "./.env.local"});

const makeRequestSepolia = async () => {
  if (!process.env.ETHEREUM_PROVIDER_AVALANCHEFUJI) {
    throw new Error("ETHEREUM_PROVIDER_AVALANCHEFUJI not provided - check your environment variables");
  }
  if (!process.env.AWS_API_KEY) {
    throw new Error("AWS_API_KEY not provided - check your environment variables");
  }
  if (!process.env.EVM_PRIVATE_KEY) {
    throw new Error("EVM_PRIVATE_KEY not provided - check your environment variables");
  }

  // hardcoded for Avalanche Fuji
  const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
  const donId = "fun-avalanche-fuji-1";
  const rpcUrl = process.env.ETHEREUM_PROVIDER_AVALANCHEFUJI; // fetch Sepolia RPC URL

  const gatewayUrls = [
    "https://01.functions-gateway.testnet.chain.link/",
    "https://02.functions-gateway.testnet.chain.link/",
  ];
  const slotIdNumber = 0;
  const expirationTimeMinutes = 1440;

  const secrets = { apiKey: process.env.AWS_API_KEY };

  // Initialize ethers signer and provider to interact with the contracts onchain
  const privateKey = process.env.EVM_PRIVATE_KEY; // fetch EVM_PRIVATE_KEY
  if (!privateKey) throw new Error("private key not provided - check your environment variables");

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider); // create ethers signer for signing transactions

  //////// MAKE REQUEST ////////

  console.log("\nMake request...");

  // First encrypt secrets and create a gist
  const secretsManager = new SecretsManager({
    signer: signer,
    functionsRouterAddress: routerAddress,
    donId: donId,
  });
  await secretsManager.initialize();

  // Encrypt secrets
  const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);

  console.log(
    `Upload encrypted secret to gateways ${gatewayUrls}. slotId ${slotIdNumber}. Expiration in minutes: ${expirationTimeMinutes}`
  );

  // Upload secrets
  const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
    gatewayUrls: gatewayUrls,
    slotId: slotIdNumber,
    minutesUntilExpiration: expirationTimeMinutes,
  });

  if (!uploadResult.success) throw new Error(`Encrypted secrets not uploaded to ${gatewayUrls}`);

  console.log(`\n✅ Secrets uploaded properly to gateways ${gatewayUrls}! Gateways response: `, uploadResult);

  const donHostedSecretsVersion = parseInt(uploadResult.version); // fetch the reference of the encrypted secrets

  // Save info in case we clear console
  fs.writeFileSync(
    "donSecretsInfo.txt",
    JSON.stringify(
      {
        donHostedSecretsVersion: donHostedSecretsVersion.toString(),
        slotId: slotIdNumber.toString(),
        expirationTimeMinutes: expirationTimeMinutes.toString(),
      },
      null,
      2
    )
  );

  console.log(`donHostedSecretsVersion is ${donHostedSecretsVersion},  Saved info to donSecretsInfo.txt`);
};

makeRequestSepolia().catch(e => {
  console.error(e);
  process.exit(1);
});
