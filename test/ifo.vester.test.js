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
const Whitelistable = contract.fromArtifact("Whitelistable");
const Vester = contract.fromArtifact("Vester");

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
        this.whitelistable = await Whitelistable.new({from: caller});
        this.vester1 = await Vester.new({from: caller});
        this.vester2 = await Vester.new({from: caller});
        this.ifoInit1          = await IFOInitializable.new({from: caller});
        this.ifoInit2       = await IFOInitializable.new({from: caller});
        await this.mojitoProfile.grantRole(await this.mojitoProfile.POINT_ROLE(), this.ifoInit1.address, {from: caller});
        await this.mojitoProfile.grantRole(await this.mojitoProfile.POINT_ROLE(), this.ifoInit2.address, {from: caller});
    });

    it("initialize()", async function () {
        await expectEvent(await this.ifoInit1.initialize(
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

        await expectEvent(await this.ifoInit2.initialize(
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

    it("setPool(0)", async function () {
        await expectEvent(await this.ifoInit1.setPool(
            "100", // 100 offering
            "100", // 100 lp
            "50",  // max 50 lp
            false,
            0,
            this.whitelistable.address,
            this.vester1.address,
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
        await expectEvent(await this.ifoInit2.setPool(
            "200", // 200 offering
            "200", // 200 lp
            "0",
            true,
            1,
            this.whitelistable.address,
            this.vester2.address,
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
        expect(await this.ifoInit1.totalTokensOffered()).to.be.bignumber.equal(new BN("100"));
    });

    it("updatePointParameters()", async function () {
        await expectEvent(await this.ifoInit1.updatePointParameters(
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

    it("addAddressesToWhitelist()", async function () {
        expect(await this.whitelistable.isWhitelisted(other)).to.be.equal(false);
        await this.whitelistable.addAddressesToWhitelist(
            [caller,other],
            {from: caller}
        );
        expect(await this.whitelistable.isWhitelisted(caller)).to.be.equal(true);
        expect(await this.whitelistable.isWhitelisted(other)).to.be.equal(true);
    });

    it("removeAddressesFromWhitelist()", async function () {
        expect(await this.whitelistable.isWhitelisted(other)).to.be.equal(true);
        await this.whitelistable.removeAddressesFromWhitelist(
            [other],
            {from: caller}
        );
        expect(await this.whitelistable.isWhitelisted(other)).to.be.equal(false);
    });

    it("setHandler()", async function () {
        await this.vester1.setHandler(
            this.ifoInit1.address,
            true,
            {from: caller},
        );
        await this.vester2.setHandler(
            this.ifoInit2.address,
            true,
            {from: caller},
        );
    });

    it("setClaimTime()", async function () {
        let currentTime=await time.latest()
        await this.vester1.setClaimTime(
            currentTime+600,
            {from: caller},
        );
        await this.vester2.setClaimTime(
            currentTime+600,
            {from: caller},
        );
    });

    it("setOfferingToken()", async function () {
        await this.vester1.setOfferingToken(
            this.offeringToken.address,
            {from: caller},
        );
        await this.vester2.setOfferingToken(
            this.offeringToken.address,
            {from: caller},
        );
    });

    it("updateStartAndEndBlocks()", async function () {
        await expectEvent(await this.ifoInit1.updateStartAndEndBlocks(
            "60",
            "100",
            {from: caller},
            ),
            "NewStartAndEndBlocks",
            {
                startBlock: "60",
                endBlock:   "100",
            });
        await expectEvent(await this.ifoInit2.updateStartAndEndBlocks(
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

    it("updateHarvestBlocks()", async function () {
        await expectEvent(await this.ifoInit1.updateHarvestBlocks(
            "101",
            {from: caller},
            ),
            "NewHarvestBlocks",
            {
                harvestBlock: "101",
            });

        await expectEvent(await this.ifoInit2.updateHarvestBlocks(
                "101",
                {from: caller},
            ),
            "NewHarvestBlocks",
            {
                harvestBlock: "101",
            });
    });

    it("initAccountAndAdvanceBlockTo(60)", async function () {
        await time.advanceBlockTo(60);
        await this.lpToken.mint(caller, "450");
        await this.lpToken.mint(other, "400");
        await this.lpToken.approve(this.ifoInit1.address, constants.MAX_UINT256, {from: caller});
        await this.lpToken.approve(this.ifoInit1.address, constants.MAX_UINT256, {from: other});
        await this.lpToken.approve(this.ifoInit2.address, constants.MAX_UINT256, {from: caller});
        await this.lpToken.approve(this.ifoInit2.address, constants.MAX_UINT256, {from: other});
    });

    it("depositPool(not in the whitelist)", async function () {

        await this.mojitoToken.mint(other, "500");
        await this.mojitoNFT.mint(other, 2);
        await this.mojitoToken.approve(this.mojitoProfile.address, constants.MAX_UINT256, {from: other});
        await this.mojitoNFT.setApprovalForAll(this.mojitoProfile.address, true, {from: other});
        await this.mojitoProfile.addTeam(
            "MojitoStar2",
            "Mojito To The Moon",
            {from: caller},
        );
        await this.mojitoProfile.createProfile(
            1,
            this.mojitoNFT.address,
            2,
            {from: other},
        );

        await this.lpToken.mint(other, "500");
        await this.lpToken.approve(this.ifoInit1.address, constants.MAX_UINT256, {from: other});
        await expectRevert(this.ifoInit1.depositPool(
            "100",
            "0",
            {from: other},
        ), "IFOInitializable::depositPool: This address is not in the whitelist");
    });

    it("depositPool(0)", async function () {
        await expectEvent(await this.ifoInit1.depositPool(
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
        const data = await this.ifoInit1.viewPoolInformation(0);
        expect(data[0]).to.be.bignumber.equal(new BN("100"));
        expect(data[1]).to.be.bignumber.equal(new BN("100"));
        expect(data[2]).to.be.bignumber.equal(new BN("50"));
        expect(data[3]).to.be.equal(false);
        expect(data[4]).to.be.bignumber.equal(new BN("50"));
        expect(data[5]).to.be.bignumber.equal(new BN("0"));
    });

    it("viewPoolTaxRateOverflow(0)", async function () {
        expect(await this.ifoInit1.viewPoolTaxRateOverflow(0)).to.be.bignumber.equal(new BN("0"));
    });

    it("viewUserAllocationPools(0)", async function () {
        const data = await this.ifoInit1.viewUserAllocationPools(caller, [0]);
        expect(data[0]).to.be.bignumber.equal(new BN("1000000000000"));
    });

    it("viewUserInfo(0)", async function () {
        const data = await this.ifoInit1.viewUserInfo(caller, [0, 1]);
        expect(data[0][0]).to.be.bignumber.equal(new BN("50"));
        expect(data[1][0]).to.be.equal(false);
    });

    it("viewUserOfferingAndRefundingAmountsForPools(0)", async function () {
        const data = await this.ifoInit1.viewUserOfferingAndRefundingAmountsForPools(caller, [0]);
        expect(data[0][0]).to.be.bignumber.equal(new BN("50"));
        expect(data[0][1]).to.be.bignumber.equal(new BN("0"));
        expect(data[0][2]).to.be.bignumber.equal(new BN("0"));
    });

    it("depositPool(1)", async function () {
        await expectEvent(await this.ifoInit2.depositPool(
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
        const data = await this.ifoInit2.viewPoolInformation(1);
        expect(data[0]).to.be.bignumber.equal(new BN("200"));
        expect(data[1]).to.be.bignumber.equal(new BN("200"));
        expect(data[2]).to.be.bignumber.equal(new BN("0"));
        expect(data[3]).to.be.equal(true);
        expect(data[4]).to.be.bignumber.equal(new BN("400"));
        expect(data[5]).to.be.bignumber.equal(new BN("0"));
    });

    it("viewPoolTaxRateOverflow(1)", async function () {
        expect(await this.ifoInit2.viewPoolTaxRateOverflow(1)).to.be.bignumber.equal(new BN("10000000000"));
    });

    it("viewUserAllocationPools(1)", async function () {
        const data = await this.ifoInit2.viewUserAllocationPools(caller, [1]);
        expect(data[0]).to.be.bignumber.equal(new BN("1000000000000"));
    });

    it("viewUserInfo(1)", async function () {
        const data = await this.ifoInit2.viewUserInfo(caller, [0, 1]);
        expect(data[0][1]).to.be.bignumber.equal(new BN("400"));
        expect(data[1][1]).to.be.equal(false);
    });

    it("viewUserOfferingAndRefundingAmountsForPools(1)", async function () {
        const data = await this.ifoInit2.viewUserOfferingAndRefundingAmountsForPools(caller, [1]);
        expect(data[0][0]).to.be.bignumber.equal(new BN("200"));
        expect(data[0][1]).to.be.bignumber.equal(new BN("198"));
        expect(data[0][2]).to.be.bignumber.equal(new BN("2"));
    });

    it("harvestPool(too early)", async function () {
        await expectRevert(this.ifoInit1.harvestPool(
            "0",
            {from: caller},
        ), "IFOInitializable::harvestPool: Too early");
    });

    it("initAccountAndAdvanceBlockTo(101)", async function () {
        await time.advanceBlockTo(101);
    });

    it("depositPool(too late)", async function () {
        await expectRevert(this.ifoInit1.depositPool(
            "100",
            "0",
            {from: caller},
        ), "IFOInitializable::depositPool: Too late");
    });

    it("updatePointParameters(has ended)", async function () {
        await expectRevert(this.ifoInit1.updatePointParameters(
            1,
            100,
            10,
            {from: caller},
        ), "IFOInitializable::updatePointParameters: IFO has ended");
    });

    it("harvestPool(valid pid)", async function () {
        await expectRevert(this.ifoInit1.harvestPool(
            "3",
            {from: caller},
        ), "IFOInitializable::harvestPool: Non valid pool id");
    });

    it("harvestPool(not participate)", async function () {
        await expectRevert(this.ifoInit1.harvestPool(
            "0",
        ), "IFOInitializable::harvestPool: Did not participate");
    });

    it("harvestPool(0)", async function () {
        await expectEvent(await this.ifoInit1.harvestPool(
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
        const data = await this.vester1.claimable(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("50"));
        expect(data[1]).to.be.equal(false);
    });

    it("harvestPool(1)", async function () {
        await expectEvent(await this.ifoInit2.harvestPool(
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
        const data = await this.vester2.claimable(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("200"));
        expect(data[1]).to.be.equal(false);
    });

    it.skip("harvestPool(already done)", async function () {
        await expectRevert(this.ifoInit1.harvestPool(
            "0",
        ), "IFOInitializable::harvestPool: Already done");
    });

    it("increase time", async function () {
        let currentTime=await time.latest()
        await time.increase(currentTime+600);
    });

    it("claim(vester contract not amount)", async function () {
        await expectRevert(this.vester1.claim(
            {from: caller},
        ), "ERC20: transfer amount exceeds balance");
    });

    it("claim(0)", async function () {
        await this.offeringToken.mint(this.vester1.address, "50");
        await this.vester1.claim(
            {from: caller},
        );
        const data = await this.vester1.claimable(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("50"));
        expect(data[1]).to.be.equal(true);
    });

    it("claim(1)", async function () {
        await this.offeringToken.mint(this.vester2.address, "200");
        await this.vester2.claim(
            {from: caller},
        );
        const data = await this.vester2.claimable(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("200"));
        expect(data[1]).to.be.equal(true);
    });

    it("finalWithdraw(not owner)", async function () {
        await expectRevert(this.ifoInit1.finalWithdraw(
            1,
            10,
        ), "Ownable: caller is not the owner");
    });

    it("finalWithdraw(LP token error)", async function () {
        await expectRevert(this.ifoInit1.finalWithdraw(
            10000,
            1,
            {from: caller},
        ), "IFOInitializable::finalWithdraw: Not enough LP tokens");
    });

    it("finalWithdraw(offering token error)", async function () {
        await expectRevert(this.ifoInit1.finalWithdraw(
            1,
            10000,
            {from: caller},
        ), "IFOInitializable::finalWithdraw: Not enough offering tokens");
    });

    it("finalWithdraw() 1", async function () {
        await expectEvent(await this.ifoInit2.finalWithdraw(
                200,
                0,
                {from: caller},
            ),
            "AdminWithdraw",
            {
                amountLP:            "200",
                amountOfferingToken: "0",
            });
    });

    it("recoverWrongTokens(not owner)", async function () {
        await expectRevert(this.ifoInit1.recoverWrongTokens(
            this.lpToken.address,
            10,
        ), "Ownable: caller is not the owner");
    });

    it("recoverWrongTokens(LP token error)", async function () {
        await expectRevert(this.ifoInit1.recoverWrongTokens(
            this.lpToken.address,
            10,
            {from: caller},
        ), "IFOInitializable::recoverWrongTokens: Cannot be LP token");
    });

    it("recoverWrongTokens(offering token error)", async function () {
        await expectRevert(this.ifoInit1.recoverWrongTokens(
            this.offeringToken.address,
            10,
            {from: caller},
        ), "IFOInitializable::recoverWrongTokens: Cannot be offering token");
    });

    it("recoverWrongTokens()", async function () {
        await this.mojitoToken.mint(this.ifoInit1.address, "100");
        await expectEvent(await this.ifoInit1.recoverWrongTokens(
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
