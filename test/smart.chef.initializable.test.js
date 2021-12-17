const {
          accounts,
          contract,
      }                      = require("@openzeppelin/test-environment");
const {
          BN,
          expectRevert,
          expectEvent,
          time,
      }                      = require("@openzeppelin/test-helpers");
const {expect}               = require("chai");
const SmartChefInitializable = contract.fromArtifact("SmartChefInitializable");
const MojitoERC20Mock        = contract.fromArtifact("MojitoERC20Mock");


describe("SmartChefInitializable", function () {
    const [caller, other] = accounts;
    before(async function () {
        this.stakeToken    = await MojitoERC20Mock.new("MJT", "MJT", {from: caller});
        this.rewardToken   = await MojitoERC20Mock.new("WKC", "WKCS", {from: caller});
        this.rewardToken30 = await MojitoERC20Mock.new("WKC", "WKCS", {from: caller});
        this.self          = await SmartChefInitializable.new({from: caller});
    });

    it("initialize(not factory)", async function () {
        await expectRevert(this.self.initialize(
            this.stakeToken.address,
            this.rewardToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
        ), "SmartChefInitializable::initialize: Not factory");
    });

    it("initialize(gt 30)", async function () {
        await this.rewardToken30.setupDecimals(30);
        await expectRevert(this.self.initialize(
            this.stakeToken.address,
            this.rewardToken30.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
            {from: caller},
        ), "SmartChefInitializable::initialize: Must be inferior to 30");
    });

    it("initialize()", async function () {
        await expectEvent(await this.self.initialize(
            this.stakeToken.address,
            this.rewardToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "100000000000000000000",
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
            this.stakeToken.address,
            this.rewardToken.address,
            "1000000000000000000",
            "1000",
            "2000",
            "0",
            caller,
            {from: caller},
        ), "SmartChefInitializable::initialize: Already initialized");
    });

    it("SMART_CHEF_FACTORY()", async function () {
        expect(await this.self.SMART_CHEF_FACTORY()).to.be.equal(caller);
    });

    it("hasUserLimit()", async function () {
        expect(await this.self.hasUserLimit()).to.be.equal(true);
    });

    it("poolLimitPerUser()", async function () {
        expect(await this.self.poolLimitPerUser()).to.be.bignumber.equal(new BN("100000000000000000000"));
    });

    it("isInitialized()", async function () {
        expect(await this.self.isInitialized()).to.be.equal(true);
    });

    it("accTokenPerShare()", async function () {
        expect(await this.self.accTokenPerShare()).to.be.bignumber.equal(new BN(0));
    });

    it("startBlock()", async function () {
        expect(await this.self.startBlock()).to.be.bignumber.equal(new BN("1000"));
    });

    it("lastRewardBlock()", async function () {
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("1000"));
    });

    it("rewardPerBlock()", async function () {
        expect(await this.self.rewardPerBlock()).to.be.bignumber.equal(new BN("1000000000000000000"));
    });

    it("bonusEndBlock()", async function () {
        expect(await this.self.bonusEndBlock()).to.be.bignumber.equal(new BN("2000"));
    });

    it("PRECISION_FACTOR()", async function () {
        expect(await this.self.PRECISION_FACTOR()).to.be.bignumber.equal(new BN("1000000000000"));
    });

    it("stakedToken()", async function () {
        expect(await this.self.stakedToken()).to.be.equal(this.stakeToken.address);
    });

    it("rewardToken()", async function () {
        expect(await this.self.rewardToken()).to.be.equal(this.rewardToken.address);
    });

    it("updatePoolLimitPerUser(not owner)", async function () {
        await expectRevert(this.self.updatePoolLimitPerUser(
            false,
            0,
        ), "Ownable: caller is not the owner");
    });

    it("updatePoolLimitPerUser(too lower)", async function () {
        await expectRevert(this.self.updatePoolLimitPerUser(
            true,
            0,
            {from: caller},
        ), "SmartChefInitializable::updatePoolLimitPerUser: New limit must be higher");
    });

    it("updatePoolLimitPerUser()", async function () {
        await expectEvent(await this.self.updatePoolLimitPerUser(
            true,
            "200000000000000000000",
            {from: caller},
            ),
            "NewPoolLimit",
            {
                poolLimitPerUser: "200000000000000000000",
            });
    });

    it("updateRewardPerBlock(not owner)", async function () {
        await expectRevert(this.self.updateRewardPerBlock(
            1,
        ), "Ownable: caller is not the owner");
    });

    it("updateRewardPerBlock()", async function () {
        await expectEvent(await this.self.updateRewardPerBlock(
            "2000000000000000000",
            {from: caller},
            ),
            "NewRewardPerBlock",
            {
                rewardPerBlock: "2000000000000000000",
            });
    });

    it("updateStartAndEndBlocks(not owner)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            1,
            2,
        ), "Ownable: caller is not the owner");
    });

    it("updateStartAndEndBlocks(too higher)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            2,
            1,
            {from: caller},
        ), "SmartChefInitializable::updateStartAndEndBlocks: New startBlock must be lower than new endBlock");
    });

    it("updateStartAndEndBlocks(too lower)", async function () {
        await expectRevert(this.self.updateStartAndEndBlocks(
            1,
            2,
            {from: caller},
        ), "SmartChefInitializable::updateStartAndEndBlocks: New startBlock must be higher than current block");
    });

    it("updateStartAndEndBlocks()", async function () {
        await expectEvent(await this.self.updateStartAndEndBlocks(
            "1005",
            "2005",
            {from: caller},
            ),
            "NewStartAndEndBlocks",
            {
                startBlock: "1005",
                endBlock:   "2005",
            });
    });

    it("initAccountAndAdvanceBlockTo(990)", async function () {
        await this.stakeToken.mint(caller, "400000000000000000000");
        await this.rewardToken.mint(this.self.address, "2000000000000000000000");
        await this.rewardToken30.mint(this.self.address, "2000000000000000000000");
        await this.stakeToken.approve(this.self.address, "400000000000000000000", {from: caller});
        expect(await this.stakeToken.balanceOf(caller)).to.be.bignumber.equal(new BN("400000000000000000000"));
        expect(await this.rewardToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("2000000000000000000000"));
        expect(await this.rewardToken30.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("2000000000000000000000"));
        await time.advanceBlockTo(990);
    });

    it("recoverWrongTokens(not owner)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.rewardToken30.address,
            2,
        ), "Ownable: caller is not the owner");
    });

    it("recoverWrongTokens(stake token)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.stakeToken.address,
            2,
            {from: caller},
        ), "SmartChefInitializable::recoverWrongTokens: Cannot be staked token");
    });

    it("recoverWrongTokens(reward token)", async function () {
        await expectRevert(this.self.recoverWrongTokens(
            this.rewardToken.address,
            2,
            {from: caller},
        ), "SmartChefInitializable::recoverWrongTokens: Cannot be reward token");
    });

    it("recoverWrongTokens()", async function () {
        await expectEvent(await this.self.recoverWrongTokens(
            this.rewardToken30.address,
            "2000000000000000000000",
            {from: caller},
            ),
            "AdminTokenRecovery",
            {
                tokenRecovered: this.rewardToken30.address,
                amount:         "2000000000000000000000",
            });
        expect(await this.rewardToken30.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("0"));
        expect(await this.rewardToken30.balanceOf(caller)).to.be.bignumber.equal(new BN("2000000000000000000000"));
    });

    it("deposit(above limit)", async function () {
        await expectRevert(this.self.deposit(
            "400000000000000000000",
            {from: caller},
        ), "SmartChefInitializable::deposit: User amount above limit");
    });

    it("deposit(100)", async function () {
        await expectEvent(await this.self.deposit(
            "100000000000000000000",
            {from: caller},
            ),
            "Deposit",
            {
                user:   caller,
                amount: "100000000000000000000",
            });
    });

    it("userInfo(before)", async function () {
        const data = await this.self.userInfo(caller);
        expect(data.amount).to.be.bignumber.equal(new BN("100000000000000000000"));
        expect(data.rewardDebt).to.be.bignumber.equal(new BN("0"));
    });

    it("pendingReward()", async function () {
        expect(await this.self.pendingReward(caller)).to.be.bignumber.equal(new BN("0"));
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("1005"));
    });

    it("initAccountAndAdvanceBlockTo(1005)", async function () {
        await time.advanceBlockTo(1005);
    });

    it("deposit(200)", async function () {
        // reward:(1006-1005)*2
        await expectEvent(await this.self.deposit(
            "100000000000000000000",
            {from: caller},
            ),
            "Deposit",
            {
                user:   caller,
                amount: "100000000000000000000",
            });
        expect(await this.rewardToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("1998000000000000000000"));
        expect(await this.rewardToken.balanceOf(caller)).to.be.bignumber.equal(new BN("2000000000000000000"));
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("1006"));
    });

    it("userInfo(deposit-using)", async function () {
        const data = await this.self.userInfo(caller);
        expect(data.amount).to.be.bignumber.equal(new BN("200000000000000000000"));
        expect(data.rewardDebt).to.be.bignumber.equal(new BN("4000000000000000000"));
    });

    it("withdraw(too high)", async function () {
        await expectRevert(this.self.withdraw(
            "400000000000000000000",
        ), "SmartChefInitializable::withdraw: Amount to withdraw too high");
    });

    it("withdraw(100)", async function () {
        // reward:(1008-1006)*2
        await expectEvent(await this.self.withdraw(
            "100000000000000000000",
            {from: caller},
            ),
            "Withdraw",
            {
                user:   caller,
                amount: "100000000000000000000",
            });
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("1008"));
        expect(await this.rewardToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("1994000000000000000000"));
        expect(await this.rewardToken.balanceOf(caller)).to.be.bignumber.equal(new BN("6000000000000000000"));
    });

    it("userInfo(withdraw-using)", async function () {
        const data = await this.self.userInfo(caller);
        expect(data.amount).to.be.bignumber.equal(new BN("100000000000000000000"));
        expect(data.rewardDebt).to.be.bignumber.equal(new BN("4000000000000000000"));
    });

    it("initAccountAndAdvanceBlockTo(2005)", async function () {
        await time.advanceBlockTo(2005);
    });

    it("deposit(200)", async function () {
        // reward:(2006(5)-1008)*2
        await expectEvent(await this.self.deposit(
            "100000000000000000000",
            {from: caller},
            ),
            "Deposit",
            {
                user:   caller,
                amount: "100000000000000000000",
            });
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("2006"));
        expect(await this.rewardToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("0"));
        expect(await this.rewardToken.balanceOf(caller)).to.be.bignumber.equal(new BN("2000000000000000000000"));
    });

    it("withdraw(100)", async function () {
        // reward:(2007-2006)*0
        await expectEvent(await this.self.withdraw(
            "100000000000000000000",
            {from: caller},
            ),
            "Withdraw",
            {
                user:   caller,
                amount: "100000000000000000000",
            });
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("2007"));
        expect(await this.rewardToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("0"));
        expect(await this.rewardToken.balanceOf(caller)).to.be.bignumber.equal(new BN("2000000000000000000000"));
    });

    it("emergencyWithdraw(100)", async function () {
        // reward:(2008-2007)*0
        await expectEvent(await this.self.emergencyWithdraw(
            {from: caller},
            ),
            "EmergencyWithdraw",
            {
                user:   caller,
                amount: "100000000000000000000",
            });
        expect(await this.self.lastRewardBlock()).to.be.bignumber.equal(new BN("2007"));
        expect(await this.rewardToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("0"));
        expect(await this.rewardToken.balanceOf(caller)).to.be.bignumber.equal(new BN("2000000000000000000000"));
        expect(await this.stakeToken.balanceOf(caller)).to.be.bignumber.equal(new BN("400000000000000000000"));
    });

    it("stopReward(not owner)", async function () {
        await expectRevert(this.self.stopReward(), "Ownable: caller is not the owner");
    });

    it("stopReward()", async function () {
        await this.self.stopReward({from: caller});
        expect(await this.self.bonusEndBlock()).to.be.bignumber.equal(new BN("2010"));

    });

    it("emergencyRewardWithdraw(not owner)", async function () {
        await expectRevert(this.self.emergencyRewardWithdraw("0"), "Ownable: caller is not the owner");
    });

    it("emergencyRewardWithdraw()", async function () {
        await this.rewardToken.mint(this.self.address, "2000000000000000000000");
        await this.self.emergencyRewardWithdraw(
            "2000000000000000000000",
            {from: caller},
        );
    });

});
