// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */
contract FunctionsConsumerExample is FunctionsClient, ERC721URIStorage {
    using FunctionsRequest for FunctionsRequest.Request;

    uint256 public tokenId = 0;
    mapping(bytes32 => address) reqIdToAddr;
    string constant META_DATA = "ipfs://QmfNhhpUezQLcyqXBGL4ehPwo7Gfbwk9yy3YcJqGgr9dPb";
    uint8 public secretsSlotId;
    uint64 public secretsVersion;
    uint64 public subId;


    address public constant ROUTER_ADDR = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    uint32 constant public GAS_LIMIT = 300_000;
    bytes32 constant public DON_ID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000;
    string constant SOURCE = 
        'if(!secrets.apiKey) {throw Error("API key is not provided")};'
        "const apiKey = secrets.apiKey;"
        "const playerAddress = args[0];"
        "const apiResponse = await Functions.makeHttpRequest({"
            'url: "https://ao7dz5it5antkg6npd5gezptqu0qpkat.lambda-url.us-east-1.on.aws/",'
            'method: "GET",'
            "headers: {"
            '"api-key": apiKey,'
            '"player": playerAddress}});'

        'if (apiResponse.error) {console.error(apiResponse.error);throw Error("Request failed");};'
        "const { data } = apiResponse;"
        'if(!data.score) {console.error("the user does not exist");throw Error("Score does not exist, request failed");};'
        "return Functions.encodeInt256(data.score);";

    error UnexpectedRequestID(bytes32 requestId);

    event Response(bytes32 indexed requestId, bytes response, bytes err);

    constructor() FunctionsClient(ROUTER_ADDR) ERC721("BlackJack", "BJT") {}

    function setConfig(uint8 _secretsSlotId, uint64 _secretsVersion, uint64 _subId) public {
        secretsSlotId = _secretsSlotId;
        secretsVersion = _secretsVersion;
        subId = _subId;
    }


    function sendRequest(
        string[] memory args,
        address player
    ) external returns (bytes32 requestId) {
        require(secretsVersion > 0, "You have to set secrets version");
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);

        if (secretsVersion > 0) {
            req.addDONHostedSecrets(
                secretsSlotId,
                secretsVersion
            );
        }
        if (args.length > 0) req.setArgs(args);
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subId,
            GAS_LIMIT,
            DON_ID
        );
        reqIdToAddr[s_lastRequestId] = player;
        return s_lastRequestId;
    }

    /**
     * @notice Store latest result/error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the execution pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }
        s_lastResponse = response;
        s_lastError = err;
        int256 score = abi.decode(response, (int256));
        address player = reqIdToAddr[requestId];
        if(score > 1000) {
            safeMint(player, META_DATA);
        }
        emit Response(requestId, s_lastResponse, s_lastError);
    }

    function safeMint(address player, string memory metaDataUrl) internal {
        _safeMint(player, tokenId);
        _setTokenURI(tokenId, metaDataUrl);
        tokenId++;
    }
}