const {
          accounts,
          contract,
      }                = require("@openzeppelin/test-environment");
const {
          BN,
          constants,
          expectRevert,
          expectEvent,
      }                = require("@openzeppelin/test-helpers");
const {expect}         = require("chai");
const IFODeployer      = contract.fromArtifact("IFODeployer");
const MojitoProfile    = contract.fromArtifact("MojitoProfile");
const MojitoERC20Mock  = contract.fromArtifact("MojitoERC20Mock");
const MojitoERC721Mock = contract.fromArtifact("MojitoERC721Mock");


describe("IFODeployer", function () {
    const [caller, other] = accounts;
    before(async function () {
        this.mojitoToken   = await MojitoERC20Mock.new("ERC20", "ERC20", {from: caller});
        this.mojitoNFT     = await MojitoERC721Mock.new("ERC721", "ERC721", {from: caller});
        this.mojitoProfile = await MojitoProfile.new(
            this.mojitoToken.address,
            "1000000000000000000",
            "3000000000000000000",
            "2000000000000000000",
            {from: caller});
        this.lpToken       = await MojitoERC20Mock.new("LP", "LP", {from: caller});
        this.offeringToken = await MojitoERC20Mock.new("IFO", "IFO", {from: caller});
        this.self          = await IFODeployer.new(this.mojitoProfile.address, {from: caller});
    });

    it("MAX_BUFFER_BLOCKS()", async function () {
        expect(await this.self.MAX_BUFFER_BLOCKS()).to.be.bignumber.equal(new BN("5184000"));
    });

    it("mojitoProfile()", async function () {
        expect(await this.self.mojitoProfile()).to.be.equal(this.mojitoProfile.address);
    });

    it("createIFO(not owner)", async function () {
        await expectRevert(this.self.createIFO(
            this.lpToken.address,
            this.offeringToken.address,
            "1",
            "2",
            caller,
        ), "Ownable: caller is not the owner");
    });

    it("createIFO(lp token error)", async function () {
        await expectRevert.unspecified(this.self.createIFO(
            constants.ZERO_ADDRESS,
            this.offeringToken.address,
            "1",
            "2",
            caller,
            {from: caller},
        ));
    });

    it("createIFO(offering token error)", async function () {
        await expectRevert.unspecified(this.self.createIFO(
            this.lpToken.address,
            constants.ZERO_ADDRESS,
            "1",
            "2",
            caller,
            {from: caller},
        ));
    });

    it("createIFO(the same token)", async function () {
        await expectRevert(this.self.createIFO(
            this.lpToken.address,
            this.lpToken.address,
            "1",
            "2",
            caller,
            {from: caller},
        ), "IFODeployer::createIFO: Tokens must be different");
    });

    it("createIFO(EndBlock too far)", async function () {
        await expectRevert(this.self.createIFO(
            this.lpToken.address,
            this.offeringToken.address,
            "1",
            "51840000",
            caller,
            {from: caller},
        ), "IFODeployer::createIFO: EndBlock too far");
    });

    it("createIFO(StartBlock>EndBlock)", async function () {
        await expectRevert(this.self.createIFO(
            this.lpToken.address,
            this.offeringToken.address,
            "200",
            "100",
            caller,
            {from: caller},
        ), "IFODeployer::createIFO: StartBlock must be inferior to endBlock");
    });

    it("createIFO(StartBlock<block.number)", async function () {
        await expectRevert(this.self.createIFO(
            this.lpToken.address,
            this.offeringToken.address,
            "1",
            "100",
            caller,
            {from: caller},
        ), "IFODeployer::createIFO: StartBlock must be greater than current block");
    });

    it("createIFO()", async function () {
        await expectEvent(await this.self.createIFO(
            this.lpToken.address,
            this.offeringToken.address,
            "100",
            "200",
            caller,
            {from: caller},
            ),
            "NewIFOContract",
            {});
    });

    it("recoverWrongTokens(not owner)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.lpToken.address,
        ), "Ownable: caller is not the owner");
    });

    it("recoverWrongTokens(balance=0)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.lpToken.address,
            {from: caller},
        ), "IFODeployer::recoverWrongTokens: Balance must be > 0");
    });

    it("recoverWrongTokens()", async function () {
        await this.lpToken.mint(this.self.address, "100000000000000000000");
        await expectEvent(await this.self.recoverWrongTokens(
            this.lpToken.address,
            {from: caller},
            ),
            "AdminTokenRecovery",
            {
                tokenRecovered: this.lpToken.address,
                amount:         new BN("100000000000000000000"),
            });
    });

});
