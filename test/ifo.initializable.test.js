const {
          accounts,
          contract,
      }                = require("@openzeppelin/test-environment");
const {
          BN,
          constants,
          expectRevert,
          expectEvent,
          time,
      }                = require("@openzeppelin/test-helpers");
const {expect}         = require("chai");
const IFOInitializable = contract.fromArtifact("IFOInitializable");
const MojitoProfile    = contract.fromArtifact("MojitoProfile");
const MojitoERC20Mock  = contract.fromArtifact("MojitoERC20Mock");
const MojitoERC721Mock = contract.fromArtifact("MojitoERC721Mock");


describe("IFOInitializable", function () {
    const [caller, other] = accounts;
    before(async function () {
        this.mojitoToken   = await MojitoERC20Mock.new("ERC20", "ERC20", {from: caller});
        this.mojitoNFT     = await MojitoERC721Mock.new("ERC721", "ERC721", {from: caller});
        this.mojitoProfile = await MojitoProfile.new(
            this.mojitoToken.address,
            "100",
            "300",
            "200",
            {from: caller});
        await this.mojitoToken.mint(caller, "500");
        await this.mojitoNFT.mint(caller, 1);
        await this.mojitoToken.approve(this.mojitoProfile.address, constants.MAX_UINT256, {from: caller});
        await this.mojitoNFT.setApprovalForAll(this.mojitoProfile.address, true, {from: caller});
        await this.mojitoProfile.addTeam(
            "MojitoStar",
            "Mojito To The Moon",
            {from: caller},
        );
        await this.mojitoProfile.addNftAddress(this.mojitoNFT.address, {from: caller});
        await this.mojitoProfile.createProfile(
            1,
            this.mojitoNFT.address,
            1,
            {from: caller},
        );
        this.lpToken       = await MojitoERC20Mock.new("LP", "LP", {from: caller});
        this.offeringToken = await MojitoERC20Mock.new("IFO", "IFO", {from: caller});
        this.self          = await IFOInitializable.new({from: caller});
        await this.mojitoProfile.grantRole(await this.mojitoProfile.POINT_ROLE(), this.self.address, {from: caller});
    });

    it("initialize(not factory)", async function () {
        await expectRevert(this.self.initialize(
            this.lpToken.address,
            this.offeringToken.address,
            this.mojitoProfile.address,
            "10",
            "2000",
            "5184000",
            caller,
        ), "IFOInitializable::initialize: Not factory");
    });

    it("initialize()", async function () {
        await expectEvent(await this.self.initialize(
            this.lpToken.address,
            this.offeringToken.address,
            this.mojitoProfile.address,
            "50",
            "100",
            "5184000",
            caller,
            {from: caller},
            ),
            "OwnershipTransferred",
            {
                previousOwner: caller,
                newOwner:      caller,
            });
    });

    it("initialize(initialized)", async function () {
        await expectRevert(this.self.initialize(
            this.lpToken.address,
            this.offeringToken.address,
            this.mojitoProfile.address,
            "10",
            "100",
            "5184000",
            caller,
            {from: caller},
        ), "IFOInitializable::initialize: Already initialized");
    });

    it("IFO_FACTORY()", async function () {
        expect(await this.self.IFO_FACTORY()).to.be.equal(caller);
    });

    it("MAX_BUFFER_BLOCKS()", async function () {
        expect(await this.self.MAX_BUFFER_BLOCKS()).to.be.bignumber.equal(new BN("5184000"));
    });

    it("lpToken()", async function () {
        expect(await this.self.lpToken()).to.be.equal(this.lpToken.address);
    });

    it("offeringToken()", async function () {
        expect(await this.self.offeringToken()).to.be.equal(this.offeringToken.address);
    });

    it("mojitoProfile()", async function () {
        expect(await this.self.mojitoProfile()).to.be.equal(this.mojitoProfile.address);
    });

    it("isInitialized()", async function () {
        expect(await this.self.isInitialized()).to.be.equal(true);
    });

    it("startBlock()", async function () {
        expect(await this.self.startBlock()).to.be.bignumber.equal(new BN("50"));
    });

    it("endBlock()", async function () {
        expect(await this.self.endBlock()).to.be.bignumber.equal(new BN("100"));
    });

    it("harvestBlock()", async function () {
        expect(await this.self.harvestBlock()).to.be.bignumber.equal(new BN("100"));
    });

    it("setPool(not owner)", async function () {
        await expectRevert(this.self.setPool(
            1,
            1,
            1,
            false,
            0,
        ), "Ownable: caller is not the owner");
    });

    it("setPool(pid not exist)", async function () {
        await expectRevert(this.self.setPool(
            1,
            1,
            1,
            false,
            3,
            {from: caller},
        ), "IFOInitializable::setPool: Pool does not exist");
    });

    it("setPool(0)", async function () {
        await expectEvent(await this.self.setPool(
            "100", // 100 offering
            "100", // 100 lp
            "50",  // max 50 lp
            false,
            0,
            {from: caller},
            ),
            "PoolParametersSet",
            {
                offeringAmountPool: new BN("100"),
                raisingAmountPool:  new BN("100"),
                pid:                "0",
            });
    });

    it("setPool(1)", async function () {
        await expectEvent(await this.self.setPool(
            "200", // 200 offering
            "200", // 200 lp
            "0",
            true,
            1,
            {from: caller},
            ),
            "PoolParametersSet",
            {
                offeringAmountPool: new BN("200"),
                raisingAmountPool:  new BN("200"),
                pid:                "1",
            });
    });

    it("totalTokensOffered()", async function () {
        expect(await this.self.totalTokensOffered()).to.be.bignumber.equal(new BN("300"));
    });

    it("updatePointParameters(not owner)", async function () {
        await expectRevert(this.self.updatePointParameters(
            1,
            100,
            10,
        ), "Ownable: caller is not the owner");
    });

    it("updatePointParameters()", async function () {
        await expectEvent(await this.self.updatePointParameters(
            1,
            100,
            10,
            {from: caller},
            ),
            "PointParametersSet",
            {
                campaignId:      "1",
                numberPoints:    "100",
                thresholdPoints: "10",
            });
    });

    it("updateStartAndEndBlocks(not owner)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            50,
            100,
        ), "Ownable: caller is not the owner");
    });

    it("updateStartAndEndBlocks(too far)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            50,
            "51840000000",
            {from: caller},
        ), "IFOInitializable::updateStartAndEndBlocks: EndBlock too far");
    });

    it("updateStartAndEndBlocks(startBlock>endBlock)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            200,
            100,
            {from: caller},
        ), "IFOInitializable::updateStartAndEndBlocks: New startBlock must be lower than new endBlock");
    });

    it("updateStartAndEndBlocks(startBlock>block.number)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            1,
            100,
            {from: caller},
        ), "IFOInitializable::updateStartAndEndBlocks: New startBlock must be higher than current block");
    });

    it("updateStartAndEndBlocks()", async function () {
        await expectEvent(await this.self.updateStartAndEndBlocks(
            "60",
            "100",
            {from: caller},
            ),
            "NewStartAndEndBlocks",
            {
                startBlock: "60",
                endBlock:   "100",
            });
    });

    it("updateHarvestBlocks(not owner)", async function () {
        await expectRevert(this.self.updateHarvestBlocks(
            100,
        ), "Ownable: caller is not the owner");
    });

    it("updateHarvestBlocks(endBlock>harvestBlock)", async function () {
        await expectRevert(this.self.updateHarvestBlocks(
            1,
            {from: caller},
        ), "IFOInitializable::updateHarvestBlocks: New harvestBlock must be higher than endBlock");
    });

    it("updateHarvestBlocks()", async function () {
        await expectEvent(await this.self.updateHarvestBlocks(
            "101",
            {from: caller},
            ),
            "NewHarvestBlocks",
            {
                harvestBlock: "101",
            });
    });

    it("depositPool(too early)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: Too early");
    });

    it("initAccountAndAdvanceBlockTo(60)", async function () {
        await time.advanceBlockTo(60);
        await this.lpToken.mint(caller, "200");
        await this.lpToken.mint(other, "200");
        await this.lpToken.approve(this.self.address, constants.MAX_UINT256, {from: caller});
        await this.lpToken.approve(this.self.address, constants.MAX_UINT256, {from: other});
    });

    it("setPool(has started)", async function () {
        await expectRevert(this.self.setPool(
            1,
            1,
            1,
            false,
            0,
            {from: caller},
        ), "IFOInitializable::setPool: IFO has started");
    });

    it("updateStartAndEndBlocks(startBlock<block.number)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            1,
            100,
            {from: caller},
        ), "IFOInitializable::updateStartAndEndBlocks: IFO has started");
    });

    it("updateHarvestBlocks(startBlock<block.number)", async function () {
        await expectRevert(this.self.updateHarvestBlocks(
            1,
            {from: caller},
        ), "IFOInitializable::updateHarvestBlocks: IFO has started");
    });

    it("depositPool(no profile)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "0",
            {from: other},
        ), "IFOInitializable::depositPool: Must have an active profile");
    });

    it("depositPool(valid pid)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "3",
            {from: caller},
        ), "IFOInitializable::depositPool: Non valid pool id");
    });

    it.skip("depositPool(not set)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: Pool not set");
    });

    it("depositPool(amount<=0)", async function () {
        await expectRevert(this.self.depositPool(
            "0",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: Amount must be > 0");
    });

    it("depositPool(not locking)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: Tokens not deposited properly");
        await this.offeringToken.mint(this.self.address, "300");
        await this.lpToken.mint(caller, "500");
        await this.lpToken.approve(this.self.address, constants.MAX_UINT256, {from: caller});
    });

    it("depositPool(user limit)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: New amount above user limit");
    });

    it("depositPool(0)", async function () {
        await expectEvent(await this.self.depositPool(
            "50",
            "0",
            {from: caller},
            ),
            "Deposit",
            {
                user:   caller,
                amount: "50",
                pid:    "0",
            });
    });

    it("viewPoolInformation(0)", async function () {
        const data = await this.self.viewPoolInformation(0);
        expect(data[0]).to.be.bignumber.equal(new BN("100"));
        expect(data[1]).to.be.bignumber.equal(new BN("100"));
        expect(data[2]).to.be.bignumber.equal(new BN("50"));
        expect(data[3]).to.be.equal(false);
        expect(data[4]).to.be.bignumber.equal(new BN("50"));
        expect(data[5]).to.be.bignumber.equal(new BN("0"));
    });

    it("viewPoolTaxRateOverflow(0)", async function () {
        expect(await this.self.viewPoolTaxRateOverflow(0)).to.be.bignumber.equal(new BN("0"));
    });

    it("viewUserAllocationPools(0)", async function () {
        const data = await this.self.viewUserAllocationPools(caller, [0]);
        expect(data[0]).to.be.bignumber.equal(new BN("1000000000000"));
    });

    it("viewUserInfo(0)", async function () {
        const data = await this.self.viewUserInfo(caller, [0, 1]);
        expect(data[0][0]).to.be.bignumber.equal(new BN("50"));
        expect(data[1][0]).to.be.equal(false);
    });

    it("viewUserOfferingAndRefundingAmountsForPools(0)", async function () {
        const data = await this.self.viewUserOfferingAndRefundingAmountsForPools(caller, [0]);
        expect(data[0][0]).to.be.bignumber.equal(new BN("50"));
        expect(data[0][1]).to.be.bignumber.equal(new BN("0"));
        expect(data[0][2]).to.be.bignumber.equal(new BN("0"));
    });

    it("depositPool(1)", async function () {
        await expectEvent(await this.self.depositPool(
            "400",
            "1",
            {from: caller},
            ),
            "Deposit",
            {
                user:   caller,
                amount: "400",
                pid:    "1",
            });
    });

    it("viewPoolInformation(1)", async function () {
        const data = await this.self.viewPoolInformation(1);
        expect(data[0]).to.be.bignumber.equal(new BN("200"));
        expect(data[1]).to.be.bignumber.equal(new BN("200"));
        expect(data[2]).to.be.bignumber.equal(new BN("0"));
        expect(data[3]).to.be.equal(true);
        expect(data[4]).to.be.bignumber.equal(new BN("400"));
        expect(data[5]).to.be.bignumber.equal(new BN("0"));
    });

    it("viewPoolTaxRateOverflow(1)", async function () {
        expect(await this.self.viewPoolTaxRateOverflow(1)).to.be.bignumber.equal(new BN("10000000000"));
    });

    it("viewUserAllocationPools(1)", async function () {
        const data = await this.self.viewUserAllocationPools(caller, [1]);
        expect(data[0]).to.be.bignumber.equal(new BN("1000000000000"));
    });

    it("viewUserInfo(1)", async function () {
        const data = await this.self.viewUserInfo(caller, [0, 1]);
        expect(data[0][1]).to.be.bignumber.equal(new BN("400"));
        expect(data[1][1]).to.be.equal(false);
    });

    it("viewUserOfferingAndRefundingAmountsForPools(1)", async function () {
        const data = await this.self.viewUserOfferingAndRefundingAmountsForPools(caller, [1]);
        expect(data[0][0]).to.be.bignumber.equal(new BN("200"));
        expect(data[0][1]).to.be.bignumber.equal(new BN("198"));
        expect(data[0][2]).to.be.bignumber.equal(new BN("2"));
    });

    it("harvestPool(too early)", async function () {
        await expectRevert(this.self.harvestPool(
            "0",
            {from: caller},
        ), "IFOInitializable::harvestPool: Too early");
    });

    it("initAccountAndAdvanceBlockTo(101)", async function () {
        await time.advanceBlockTo(101);
    });

    it("depositPool(too late)", async function () {
        await expectRevert(this.self.depositPool(
            "100",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: Too late");
    });

    it("updatePointParameters(has ended)", async function () {
        await expectRevert(this.self.updatePointParameters(
            1,
            100,
            10,
            {from: caller},
        ), "IFOInitializable::updatePointParameters: IFO has ended");
    });

    it("harvestPool(valid pid)", async function () {
        await expectRevert(this.self.harvestPool(
            "3",
            {from: caller},
        ), "IFOInitializable::harvestPool: Non valid pool id");
    });

    it("harvestPool(not participate)", async function () {
        await expectRevert(this.self.harvestPool(
            "0",
        ), "IFOInitializable::harvestPool: Did not participate");
    });

    it("harvestPool(0)", async function () {
        await expectEvent(await this.self.harvestPool(
            "0",
            {from: caller},
            ),
            "Harvest",
            {
                user:           caller,
                offeringAmount: "50",
                excessAmount:   "0",
                pid:            "0",
            });
    });

    it("harvestPool(1)", async function () {
        await expectEvent(await this.self.harvestPool(
            "1",
            {from: caller},
            ),
            "Harvest",
            {
                user:           caller,
                offeringAmount: "200",
                excessAmount:   "198",
                pid:            "1",
            });
    });

    it.skip("harvestPool(already done)", async function () {
        await expectRevert(this.self.harvestPool(
            "0",
        ), "IFOInitializable::harvestPool: Already done");
    });

    it("finalWithdraw(not owner)", async function () {
        await expectRevert(this.self.finalWithdraw(
            1,
            10,
        ), "Ownable: caller is not the owner");
    });

    it("finalWithdraw(LP token error)", async function () {
        await expectRevert(this.self.finalWithdraw(
            10000,
            1,
            {from: caller},
        ), "IFOInitializable::finalWithdraw: Not enough LP tokens");
    });

    it("finalWithdraw(offering token error)", async function () {
        await expectRevert(this.self.finalWithdraw(
            1,
            10000,
            {from: caller},
        ), "IFOInitializable::finalWithdraw: Not enough offering tokens");
    });

    it("finalWithdraw()", async function () {
        await expectEvent(await this.self.finalWithdraw(
            250,
            50,
            {from: caller},
            ),
            "AdminWithdraw",
            {
                amountLP:            "250",
                amountOfferingToken: "50",
            });
    });

    it("recoverWrongTokens(not owner)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.lpToken.address,
            10,
        ), "Ownable: caller is not the owner");
    });

    it("recoverWrongTokens(LP token error)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.lpToken.address,
            10,
            {from: caller},
        ), "IFOInitializable::recoverWrongTokens: Cannot be LP token");
    });

    it("recoverWrongTokens(offering token error)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.offeringToken.address,
            10,
            {from: caller},
        ), "IFOInitializable::recoverWrongTokens: Cannot be offering token");
    });

    it("recoverWrongTokens()", async function () {
        await this.mojitoToken.mint(this.self.address, "100");
        await expectEvent(await this.self.recoverWrongTokens(
            this.mojitoToken.address,
            100,
            {from: caller},
            ),
            "AdminTokenRecovery",
            {
                tokenAddress: this.mojitoToken.address,
                amountTokens: "100",
            });
    });

});
