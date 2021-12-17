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
const SmartChefFactory = contract.fromArtifact("SmartChefFactory");
const MojitoERC20Mock  = contract.fromArtifact("MojitoERC20Mock");


describe("SmartChefFactory", function () {
    const [caller, other] = accounts;
    before(async function () {
        this.stakeToken  = await MojitoERC20Mock.new("MJT", "MJT", {from: caller});
        this.rewardToken = await MojitoERC20Mock.new("WKC", "WKCS", {from: caller});
        this.self        = await SmartChefFactory.new({from: caller});
    });

    it("poolLength()", async function () {
        expect(await this.self.poolLength()).to.be.bignumber.equal(new BN("0"));
    });

    it("deployPool(not owner)", async function () {
        await expectRevert(this.self.deployPool(
            this.stakeToken.address,
            this.rewardToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
        ), "Ownable: caller is not the owner");
    });

    it("deployPool(stake token error)", async function () {
        await expectRevert.unspecified(this.self.deployPool(
            constants.ZERO_ADDRESS,
            this.rewardToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
            {from: caller},
        ));
    });

    it("deployPool(reward token error)", async function () {
        await expectRevert.unspecified(this.self.deployPool(
            this.stakeToken.address,
            constants.ZERO_ADDRESS,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
            {from: caller},
        ));
    });

    it("deployPool(the same token)", async function () {
        await expectRevert(this.self.deployPool(
            this.stakeToken.address,
            this.stakeToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
            {from: caller},
        ), "SmartChefFactory::deployPool: Tokens must be be different");
    });

    it("deployPool()", async function () {
        await expectEvent(await this.self.deployPool(
            this.stakeToken.address,
            this.rewardToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
            {from: caller},
            ),
            "NewSmartChefContract",
            {
                smartChef: await this.self.pools(0),
            });
    });

});
