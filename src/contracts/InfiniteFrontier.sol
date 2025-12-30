// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InfiniteFrontier
 * @dev NFT contract for AI-generated images with fully onchain metadata
 * @notice V0 MVP - Generate AI images and mint them as NFTs
 */
contract InfiniteFrontier is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;
    using Strings for address;

    // ============ Structs ============

    struct TokenData {
        string prompt;
        string imageBase64;
        string generation;
        string nftType;
        address minter;
        string aiModel;
        uint256 mintedAt;
    }

    // ============ State Variables ============

    /// @notice Mapping of token ID to token data
    mapping(uint256 => TokenData) public tokenData;

    /// @notice Fee for generating an image (covers AI compute costs)
    uint256 public generateFee = 0.00003 ether;

    /// @notice Fee for minting an NFT
    uint256 public mintFee = 0.0003 ether;

    /// @notice Current generation/version identifier
    string public currentGeneration = "V0";

    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;

    /// @notice Collection description
    string public constant COLLECTION_DESCRIPTION = 
        "Infinite Frontier - AI-generated NFTs created through human imagination and artificial intelligence collaboration. Each piece is unique, stored entirely onchain.";

    // ============ Events ============

    event ImageGenerated(address indexed user, uint256 fee, string prompt);
    event NFTMinted(
        uint256 indexed tokenId,
        address indexed minter,
        string prompt,
        string generation
    );
    event FeesWithdrawn(address indexed owner, uint256 amount);
    event GenerateFeeUpdated(uint256 oldFee, uint256 newFee);
    event MintFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============ Errors ============

    error InsufficientGenerateFee(uint256 sent, uint256 required);
    error InsufficientMintFee(uint256 sent, uint256 required);
    error EmptyPrompt();
    error EmptyImage();
    error WithdrawFailed();
    error TokenDoesNotExist(uint256 tokenId);

    // ============ Constructor ============

    constructor() ERC721("Infinite Frontier", "INFR") Ownable(msg.sender) {}

    // ============ External Functions ============

    /**
     * @notice Pay the generate fee to generate an image (called before AI generation)
     * @param prompt The text prompt used for generation
     */
    function payGenerateFee(string calldata prompt) external payable {
        if (msg.value < generateFee) {
            revert InsufficientGenerateFee(msg.value, generateFee);
        }
        if (bytes(prompt).length == 0) {
            revert EmptyPrompt();
        }

        emit ImageGenerated(msg.sender, msg.value, prompt);
    }

    /**
     * @notice Mint an NFT with the generated image
     * @param prompt The text prompt used for generation
     * @param imageBase64 The base64-encoded image data
     * @param aiModel The AI model identifier used
     */
    function mint(
        string calldata prompt,
        string calldata imageBase64,
        string calldata aiModel
    ) external payable nonReentrant {
        if (msg.value < mintFee) {
            revert InsufficientMintFee(msg.value, mintFee);
        }
        if (bytes(prompt).length == 0) {
            revert EmptyPrompt();
        }
        if (bytes(imageBase64).length == 0) {
            revert EmptyImage();
        }

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(msg.sender, newTokenId);

        tokenData[newTokenId] = TokenData({
            prompt: prompt,
            imageBase64: imageBase64,
            generation: currentGeneration,
            nftType: "OG",
            minter: msg.sender,
            aiModel: aiModel,
            mintedAt: block.timestamp
        });

        emit NFTMinted(newTokenId, msg.sender, prompt, currentGeneration);
    }

    /**
     * @notice Get the token URI with fully onchain metadata
     * @param tokenId The token ID to get URI for
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (tokenId == 0 || tokenId > _tokenIdCounter) {
            revert TokenDoesNotExist(tokenId);
        }

        TokenData memory data = tokenData[tokenId];

        string memory json = string(
            abi.encodePacked(
                '{"name":"Infinite Frontier #',
                tokenId.toString(),
                '","description":"',
                COLLECTION_DESCRIPTION,
                '","image":"data:image/png;base64,',
                data.imageBase64,
                '","attributes":[',
                _buildAttributes(data, tokenId),
                "]}"
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

    /**
     * @notice Get token data for a specific token
     * @param tokenId The token ID
     */
    function getTokenData(uint256 tokenId) external view returns (TokenData memory) {
        if (tokenId == 0 || tokenId > _tokenIdCounter) {
            revert TokenDoesNotExist(tokenId);
        }
        return tokenData[tokenId];
    }

    /**
     * @notice Get current total supply
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // ============ Owner Functions ============

    /**
     * @notice Update the generate fee
     * @param newFee The new generate fee
     */
    function setGenerateFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = generateFee;
        generateFee = newFee;
        emit GenerateFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update the mint fee
     * @param newFee The new mint fee
     */
    function setMintFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = mintFee;
        mintFee = newFee;
        emit MintFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update the current generation identifier
     * @param newGeneration The new generation string
     */
    function setGeneration(string calldata newGeneration) external onlyOwner {
        currentGeneration = newGeneration;
    }

    /**
     * @notice Withdraw collected fees
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) {
            revert WithdrawFailed();
        }
        emit FeesWithdrawn(owner(), balance);
    }

    // ============ Internal Functions ============

    function _buildAttributes(
        TokenData memory data,
        uint256 tokenId
    ) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '{"trait_type":"Generation","value":"',
                data.generation,
                '"},{"trait_type":"Type","value":"',
                data.nftType,
                '"},{"trait_type":"Prompt","value":"',
                _escapeJsonString(data.prompt),
                '"},{"trait_type":"Minter","value":"',
                Strings.toHexString(uint160(data.minter), 20),
                '"},{"trait_type":"AI Model","value":"',
                data.aiModel,
                '"},{"trait_type":"Token ID","display_type":"number","value":',
                tokenId.toString(),
                '}'
            )
        );
    }

    function _escapeJsonString(string memory input) internal pure returns (string memory) {
        bytes memory inputBytes = bytes(input);
        uint256 extraChars = 0;
        
        // Count characters that need escaping
        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == '"' || inputBytes[i] == '\\') {
                extraChars++;
            }
        }
        
        if (extraChars == 0) {
            return input;
        }
        
        bytes memory output = new bytes(inputBytes.length + extraChars);
        uint256 j = 0;
        
        for (uint256 i = 0; i < inputBytes.length; i++) {
            if (inputBytes[i] == '"' || inputBytes[i] == '\\') {
                output[j++] = '\\';
            }
            output[j++] = inputBytes[i];
        }
        
        return string(output);
    }

    // ============ Required Overrides ============

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
