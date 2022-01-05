const {
          accounts,
          contract,
      }                   = require("@openzeppelin/test-environment");
const {
          BN,
          time,
          expectRevert,
          expectEvent,
          constants,
      }                   = require("@openzeppelin/test-helpers");
const {expect}            = require("chai");
const MojitoERC20Mock     = contract.fromArtifact("MojitoERC20Mock");
const MojitoCattle        = contract.fromArtifact("MojitoCattle");
const MojitoCattleFactory = contract.fromArtifact("MojitoCattleFactory");


describe("MojitoCattleFactory", function () {
    const [caller, other] = accounts;
    before(async function () {
        this.mojitoToken  = await MojitoERC20Mock.new("ERC20", "ERC20", {from: caller});
        this.mojitoCattle = await MojitoCattle.new("ipfs://", {from: caller});
        this.self         = await MojitoCattleFactory.new(this.mojitoToken.address, this.mojitoCattle.address, {from: caller});
        await this.mojitoCattle.grantRole("0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6", this.self.address, {from: caller});
        await this.mojitoToken.mint(caller, "10000000000000000000");
        await this.mojitoToken.approve(this.self.address, constants.MAX_UINT256, {from: caller});
    });

    it("mojitoToken()", async function () {
        expect(await this.self.mojitoToken()).to.be.equal(this.mojitoToken.address);
    });

    it("mojitoCattle()", async function () {
        expect(await this.self.mojitoCattle()).to.be.equal(this.mojitoCattle.address);
    });

    it("addMojitoCattleInformation(not owner)", async function () {
        await expectRevert(this.self.addMojitoCattleInformation("Dabbler", "hash/dabbler.json", "5000000000000000000", "110", "220"),
            "Ownable: caller is not the owner");
    });

    it("addMojitoCattleInformation(>20)", async function () {
        await expectRevert(this.self.addMojitoCattleInformation("012345678901234567890", "hash/dabbler.json", "5000000000000000000", "110", "220", {from: caller}),
            "MojitoCattleFactory::addMojitoCattleInformation: Must be < 20");
    });

    it("addMojitoCattleInformation(<3)", async function () {
        await expectRevert(this.self.addMojitoCattleInformation("01", "hash/dabbler.json", "5000000000000000000", "110", "220", {from: caller}),
            "MojitoCattleFactory::addMojitoCattleInformation: Must be > 3");
    });

    it("addMojitoCattleInformation(block.number<startBlockNumber)", async function () {
        await expectRevert(this.self.addMojitoCattleInformation("Dabbler", "hash/dabbler.json", "5000000000000000000", "1", "220", {from: caller}),
            "MojitoCattleFactory::addMojitoCattleInformation: New startBlock must be greater than currentBlock");
    });

    it("addMojitoCattleInformation(endBlockNumber<startBlockNumber)", async function () {
        await expectRevert(this.self.addMojitoCattleInformation("Dabbler", "hash/dabbler.json", "5000000000000000000", "110", "100", {from: caller}),
            "MojitoCattleFactory::addMojitoCattleInformation: New startBlock must be lower than new endBlock");
    });

    it("addMojitoCattleInformation()", async function () {
        await expectEvent(await this.self.addMojitoCattleInformation(
            "Dabbler",
            "hash/dabbler.json",
            "5000000000000000000",
            "110",
            "220",
            {from: caller},
            ),
            "MojitoCattleCharacteristicsAdd",
            {
                cattleId:         "1",
                cattleName:       "Dabbler",
                cattleURI:        "hash/dabbler.json",
                mojitoPrice:      "5000000000000000000",
                startBlockNumber: "110",
                endBlockNumber:   "220",
            });

        await expectEvent(await this.self.addMojitoCattleInformation(
            "Highballer",
            "hash/highballer.json",
            "0",
            "110",
            "220",
            {from: caller},
            ),
            "MojitoCattleCharacteristicsAdd",
            {
                cattleId:         "2",
                cattleName:       "Highballer",
                cattleURI:        "hash/highballer.json",
                mojitoPrice:      "0",
                startBlockNumber: "110",
                endBlockNumber:   "220",
            });
        expect(await this.mojitoCattle.getCattleName(1)).to.be.equal("Dabbler");
    });

    it("setMojitoPrice(not owner)", async function () {
        await expectRevert(this.self.setMojitoPrice("1", "10000000000000000000"),
            "Ownable: caller is not the owner");
    });

    it("setMojitoPrice(invalid id 000)", async function () {
        await expectRevert(this.self.setMojitoPrice("0", "10000000000000000000", {from: caller}),
            "MojitoCattleFactory::setMojitoPrice: Invalid cattleId");
    });

    it("setMojitoPrice(invalid id 200)", async function () {
        await expectRevert(this.self.setMojitoPrice("200", "10000000000000000000", {from: caller}),
            "MojitoCattleFactory::setMojitoPrice: Invalid cattleId");
    });

    it("setMojitoPrice()", async function () {
        await expectEvent(await this.self.setMojitoPrice(
            "1",
            "10000000000000000000",
            {from: caller},
            ),
            "MojitoPriceSet",
            {
                cattleId:            "1",
                previousMojitoPrice: "5000000000000000000",
                newMojitoPrice:      "10000000000000000000",
            });
        const mojitoCattleCharacteristics = await this.self.mojitoCattleInformation("1");
        expect(mojitoCattleCharacteristics.mojitoPrice).to.be.bignumber.equal(new BN("10000000000000000000"));
    });

    it("setStartBlockNumber(not owner)", async function () {
        await expectRevert(this.self.setStartBlockNumber("1", "120"),
            "Ownable: caller is not the owner");
    });

    it("setStartBlockNumber(invalid id 000)", async function () {
        await expectRevert(this.self.setStartBlockNumber("0", "120", {from: caller}),
            "MojitoCattleFactory::setStartBlockNumber: Invalid cattleId");
    });

    it("setStartBlockNumber(invalid id 200)", async function () {
        await expectRevert(this.self.setStartBlockNumber("200", "120", {from: caller}),
            "MojitoCattleFactory::setStartBlockNumber: Invalid cattleId");
    });

    it("setStartBlockNumber(block.number>startBlockNumber)", async function () {
        await expectRevert(this.self.setStartBlockNumber("1", "1", {from: caller}),
            "MojitoCattleFactory::setStartBlockNumber: New startBlock must be greater than currentBlock");
    });

    it("setStartBlockNumber(endBlockNumber<startBlockNumber)", async function () {
        await expectRevert(this.self.setStartBlockNumber("1", "300", {from: caller}),
            "MojitoCattleFactory::setStartBlockNumber: New startBlock must be lower than endBlock");
    });

    it("setStartBlockNumber()", async function () {
        await expectEvent(await this.self.setStartBlockNumber(
            "1",
            "120",
            {from: caller},
            ),
            "StartBlockNumberSet",
            {
                cattleId:                 "1",
                previousStartBlockNumber: "110",
                newStartBlockNumber:      "120",
            });
        const mojitoCattleCharacteristics = await this.self.mojitoCattleInformation("1");
        expect(mojitoCattleCharacteristics.startBlockNumber).to.be.bignumber.equal(new BN("120"));
    });

    it("setEndBlockNumber(not owner)", async function () {
        await expectRevert(this.self.setEndBlockNumber("1", "230"),
            "Ownable: caller is not the owner");
    });

    it("setEndBlockNumber(invalid id 000)", async function () {
        await expectRevert(this.self.setEndBlockNumber("0", "230", {from: caller}),
            "MojitoCattleFactory::setEndBlockNumber: Invalid cattleId");
    });

    it("setEndBlockNumber(invalid id 200)", async function () {
        await expectRevert(this.self.setEndBlockNumber("200", "230", {from: caller}),
            "MojitoCattleFactory::setEndBlockNumber: Invalid cattleId");
    });

    it("setEndBlockNumber(block.number>endBlockNumber)", async function () {
        await expectRevert(this.self.setEndBlockNumber("1", "1", {from: caller}),
            "MojitoCattleFactory::setEndBlockNumber: New endBlock must be greater than currentBlock");
    });

    it("setEndBlockNumber(endBlockNumber<startBlockNumber)", async function () {
        await expectRevert(this.self.setEndBlockNumber("1", "100", {from: caller}),
            "MojitoCattleFactory::setEndBlockNumber: New endBlock must be greater than startBlock");
    });

    it("setEndBlockNumber()", async function () {
        await expectEvent(await this.self.setEndBlockNumber(
            "1",
            "230",
            {from: caller},
            ),
            "EndBlockNumberSet",
            {
                cattleId:               "1",
                previousEndBlockNumber: "220",
                newEndBlockNumber:      "230",
            });
        const mojitoCattleCharacteristics = await this.self.mojitoCattleInformation("1");
        expect(mojitoCattleCharacteristics.endBlockNumber).to.be.bignumber.equal(new BN("230"));
    });

    it("mintNFT(invalid id 000)", async function () {
        await expectRevert(this.self.mintNFT("0", {from: caller}),
            "MojitoCattleFactory::mintNFT: Invalid cattleId");
    });

    it("mintNFT(invalid id 200)", async function () {
        await expectRevert(this.self.mintNFT("200", {from: caller}),
            "MojitoCattleFactory::mintNFT: Invalid cattleId");
    });

    it("mintNFT(inot set)", async function () {
        await expectRevert(this.self.mintNFT("2", {from: caller}),
            "MojitoCattleFactory::mintNFT: MojitoCattleCharacteristics not set");
    });

    it("mintNFT(too early)", async function () {
        await expectRevert(this.self.mintNFT("1", {from: caller}),
            "MojitoCattleFactory::mintNFT: Too early");
    });

    it("initAccountAndAdvanceBlockTo(150)", async function () {
        await time.advanceBlockTo(150);
    });

    it("mintNFT()", async function () {
        await expectEvent(await this.self.mintNFT(
            "1",
            {from: caller},
            ),
            "CattleMint",
            {
                to:       caller,
                tokenId:  "1",
                cattleId: "1",
            });
        expect(await this.mojitoToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("10000000000000000000"));
        expect(await this.mojitoToken.balanceOf(caller)).to.be.bignumber.equal(new BN("0"));
    });

    it("mintNFT(has claimed)", async function () {
        await expectRevert(this.self.mintNFT("1", {from: caller}),
            "MojitoCattleFactory::mintNFT: Has claimed");
    });

    it("initAccountAndAdvanceBlockTo(250)", async function () {
        await time.advanceBlockTo(250);
    });

    it("mintNFT(too late)", async function () {
        await expectRevert(this.self.mintNFT("1", {from: other}),
            "MojitoCattleFactory::mintNFT: Too late");
    });

    it("mojitoCattleInformation()", async function () {
        const mojitoCattleInformation = await this.self.mojitoCattleInformation("1");

        expect(mojitoCattleInformation.cattleId).to.be.bignumber.equal(new BN("1"));
        expect(mojitoCattleInformation.cattleName).to.be.equal("Dabbler");
        expect(mojitoCattleInformation.cattleURI).to.be.equal("hash/dabbler.json");
        expect(mojitoCattleInformation.mojitoPrice).to.be.bignumber.equal(new BN("10000000000000000000"));
        expect(mojitoCattleInformation.startBlockNumber).to.be.bignumber.equal(new BN("120"));
        expect(mojitoCattleInformation.endBlockNumber).to.be.bignumber.equal(new BN("230"));
    });

    it("canMint()", async function () {
        expect(await this.self.canMint(caller)).to.be.equal(false);
        expect(await this.self.canMint(other)).to.be.equal(true);
    });

});
