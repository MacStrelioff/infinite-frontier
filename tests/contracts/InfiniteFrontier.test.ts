import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const ethers = hre.ethers;

describe("InfiniteFrontier", function () {
  // Test fixtures
  async function deployContractFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    const InfiniteFrontierFactory = await ethers.getContractFactory("InfiniteFrontier");
    const contract = await InfiniteFrontierFactory.deploy();
    await contract.waitForDeployment();

    return { contract, owner, user1, user2 };
  }

  // Test data
  const TEST_PROMPT = "A cosmic dragon in space";
  const TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const TEST_AI_MODEL = "fluently-xl";
  const GENERATE_FEE = ethers.parseEther("0.00003");
  const MINT_FEE = ethers.parseEther("0.0003");

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.name()).to.equal("Infinite Frontier");
      expect(await contract.symbol()).to.equal("INFR");
    });

    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set correct initial fees", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.generateFee()).to.equal(GENERATE_FEE);
      expect(await contract.mintFee()).to.equal(MINT_FEE);
    });

    it("Should set initial generation to V0", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.currentGeneration()).to.equal("V0");
    });

    it("Should start with zero total supply", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.totalSupply()).to.equal(0);
    });
  });

  describe("payGenerateFee", function () {
    it("Should accept generate fee payment", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).payGenerateFee(TEST_PROMPT, { value: GENERATE_FEE })
      )
        .to.emit(contract, "ImageGenerated")
        .withArgs(user1.address, GENERATE_FEE, TEST_PROMPT);
    });

    it("Should accept overpayment", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      const overpayment = ethers.parseEther("0.0001");
      
      await expect(
        contract.connect(user1).payGenerateFee(TEST_PROMPT, { value: overpayment })
      ).to.emit(contract, "ImageGenerated");
    });

    it("Should revert with insufficient fee", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      const insufficientFee = ethers.parseEther("0.00001");
      
      await expect(
        contract.connect(user1).payGenerateFee(TEST_PROMPT, { value: insufficientFee })
      ).to.be.revertedWithCustomError(contract, "InsufficientGenerateFee");
    });

    it("Should revert with empty prompt", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).payGenerateFee("", { value: GENERATE_FEE })
      ).to.be.revertedWithCustomError(contract, "EmptyPrompt");
    });
  });

  describe("Minting", function () {
    it("Should mint an NFT with correct metadata", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE })
      )
        .to.emit(contract, "NFTMinted")
        .withArgs(1, user1.address, TEST_PROMPT, "V0");

      // Verify ownership
      expect(await contract.ownerOf(1)).to.equal(user1.address);
      
      // Verify total supply increased
      expect(await contract.totalSupply()).to.equal(1);
    });

    it("Should store correct token data", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      const tokenData = await contract.getTokenData(1);
      expect(tokenData.prompt).to.equal(TEST_PROMPT);
      expect(tokenData.imageBase64).to.equal(TEST_IMAGE_BASE64);
      expect(tokenData.generation).to.equal("V0");
      expect(tokenData.nftType).to.equal("OG");
      expect(tokenData.minter).to.equal(user1.address);
      expect(tokenData.aiModel).to.equal(TEST_AI_MODEL);
      expect(tokenData.mintedAt).to.be.gt(0);
    });

    it("Should return correct tokenURI", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      const tokenURI = await contract.tokenURI(1);
      expect(tokenURI).to.match(/^data:application\/json;base64,/);
      
      // Decode and verify JSON structure
      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const jsonString = Buffer.from(base64Data, "base64").toString();
      const metadata = JSON.parse(jsonString);
      
      expect(metadata.name).to.equal("Infinite Frontier #1");
      expect(metadata.description).to.include("AI-generated");
      expect(metadata.image).to.include("data:image/png;base64,");
      expect(metadata.attributes).to.be.an("array");
      expect(metadata.attributes.length).to.be.gt(0);
    });

    it("Should mint multiple NFTs with sequential IDs", async function () {
      const { contract, user1, user2 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      await contract.connect(user2).mint("Another prompt", TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      expect(await contract.ownerOf(1)).to.equal(user1.address);
      expect(await contract.ownerOf(2)).to.equal(user2.address);
      expect(await contract.totalSupply()).to.equal(2);
    });

    it("Should revert with insufficient mint fee", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      const insufficientFee = ethers.parseEther("0.0001");
      
      await expect(
        contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: insufficientFee })
      ).to.be.revertedWithCustomError(contract, "InsufficientMintFee");
    });

    it("Should revert with empty prompt", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint("", TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE })
      ).to.be.revertedWithCustomError(contract, "EmptyPrompt");
    });

    it("Should revert with empty image", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).mint(TEST_PROMPT, "", TEST_AI_MODEL, { value: MINT_FEE })
      ).to.be.revertedWithCustomError(contract, "EmptyImage");
    });
  });

  describe("Token Queries", function () {
    it("Should revert tokenURI for non-existent token", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      await expect(contract.tokenURI(999))
        .to.be.revertedWithCustomError(contract, "TokenDoesNotExist");
    });

    it("Should revert getTokenData for non-existent token", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      await expect(contract.getTokenData(999))
        .to.be.revertedWithCustomError(contract, "TokenDoesNotExist");
    });

    it("Should revert tokenURI for token ID 0", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      await expect(contract.tokenURI(0))
        .to.be.revertedWithCustomError(contract, "TokenDoesNotExist");
    });

    it("Should return correct current token ID", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      expect(await contract.getCurrentTokenId()).to.equal(0);
      
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      expect(await contract.getCurrentTokenId()).to.equal(1);
      
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      expect(await contract.getCurrentTokenId()).to.equal(2);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update generate fee", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      const newFee = ethers.parseEther("0.00005");
      
      await expect(contract.connect(owner).setGenerateFee(newFee))
        .to.emit(contract, "GenerateFeeUpdated")
        .withArgs(GENERATE_FEE, newFee);
      
      expect(await contract.generateFee()).to.equal(newFee);
    });

    it("Should allow owner to update mint fee", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      const newFee = ethers.parseEther("0.0005");
      
      await expect(contract.connect(owner).setMintFee(newFee))
        .to.emit(contract, "MintFeeUpdated")
        .withArgs(MINT_FEE, newFee);
      
      expect(await contract.mintFee()).to.equal(newFee);
    });

    it("Should allow owner to update generation", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      
      await contract.connect(owner).setGeneration("V1");
      expect(await contract.currentGeneration()).to.equal("V1");
    });

    it("Should allow owner to withdraw fees", async function () {
      const { contract, owner, user1 } = await loadFixture(deployContractFixture);
      
      // Generate some fees
      await contract.connect(user1).payGenerateFee(TEST_PROMPT, { value: GENERATE_FEE });
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      const contractBalance = await ethers.provider.getBalance(await contract.getAddress());
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await contract.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance - gasCost);
    });

    it("Should prevent non-owner from updating fees", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).setGenerateFee(ethers.parseEther("0.0001"))
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
      
      await expect(
        contract.connect(user1).setMintFee(ethers.parseEther("0.001"))
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-owner from updating generation", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).setGeneration("V1")
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should prevent non-owner from withdrawing", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await expect(
        contract.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  describe("JSON Escaping", function () {
    it("Should escape quotes in prompts", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      const promptWithQuotes = 'A "beautiful" dragon';
      
      await contract.connect(user1).mint(promptWithQuotes, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      const tokenURI = await contract.tokenURI(1);
      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const jsonString = Buffer.from(base64Data, "base64").toString();
      
      // Should be valid JSON
      const metadata = JSON.parse(jsonString);
      
      // Find the prompt attribute
      const promptAttr = metadata.attributes.find((attr: { trait_type: string }) => attr.trait_type === "Prompt");
      expect(promptAttr.value).to.equal(promptWithQuotes);
    });

    it("Should escape backslashes in prompts", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      const promptWithBackslash = 'Path\\to\\dragon';
      
      await contract.connect(user1).mint(promptWithBackslash, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      const tokenURI = await contract.tokenURI(1);
      const base64Data = tokenURI.replace("data:application/json;base64,", "");
      const jsonString = Buffer.from(base64Data, "base64").toString();
      
      // Should be valid JSON
      const metadata = JSON.parse(jsonString);
      expect(metadata.name).to.equal("Infinite Frontier #1");
    });
  });

  describe("ERC721 Enumerable", function () {
    it("Should support ERC721Enumerable interface", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      // ERC721Enumerable interface ID
      const ERC721EnumerableInterfaceId = "0x780e9d63";
      expect(await contract.supportsInterface(ERC721EnumerableInterfaceId)).to.be.true;
    });

    it("Should enumerate tokens by owner", async function () {
      const { contract, user1 } = await loadFixture(deployContractFixture);
      
      await contract.connect(user1).mint(TEST_PROMPT, TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      await contract.connect(user1).mint("Prompt 2", TEST_IMAGE_BASE64, TEST_AI_MODEL, { value: MINT_FEE });
      
      expect(await contract.balanceOf(user1.address)).to.equal(2);
      expect(await contract.tokenOfOwnerByIndex(user1.address, 0)).to.equal(1);
      expect(await contract.tokenOfOwnerByIndex(user1.address, 1)).to.equal(2);
    });
  });
});
