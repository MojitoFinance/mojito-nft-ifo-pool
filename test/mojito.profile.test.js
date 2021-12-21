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
const MojitoProfile    = contract.fromArtifact("MojitoProfile");
const MojitoERC20Mock  = contract.fromArtifact("MojitoERC20Mock");
const MojitoERC721Mock = contract.fromArtifact("MojitoERC721Mock");


describe("MojitoProfile", function () {
    const [caller, point, special] = accounts;
    before(async function () {
        this.mojitoToken = await MojitoERC20Mock.new("ERC20", "ERC20", {from: caller});
        this.mojitoNFT   = await MojitoERC721Mock.new("ERC721", "ERC721", {from: caller});
        this.self        = await MojitoProfile.new(
            this.mojitoToken.address,
            "1000000000000000000",
            "3000000000000000000",
            "2000000000000000000",
            {from: caller});
        await this.mojitoToken.mint(caller, "100000000000000000000");
        await this.mojitoNFT.mint(caller, 1);
        await this.mojitoNFT.mint(caller, 2);
        await this.mojitoNFT.mint(special, 3);
        await this.mojitoToken.approve(this.self.address, constants.MAX_UINT256, {from: caller});
        await this.mojitoNFT.setApprovalForAll(this.self.address, true, {from: caller});
        await this.self.grantRole(await this.self.POINT_ROLE(), point, {from: caller});
        await this.self.grantRole(await this.self.SPECIAL_ROLE(), special, {from: caller});
    });

    it("mojitoToken()", async function () {
        expect(await this.self.mojitoToken()).to.be.equal(this.mojitoToken.address);
    });

    it("numberMojitoToReactivate()", async function () {
        expect(await this.self.numberMojitoToReactivate()).to.be.bignumber.equal(new BN("1000000000000000000"));
    });

    it("numberMojitoToRegister()", async function () {
        expect(await this.self.numberMojitoToRegister()).to.be.bignumber.equal(new BN("3000000000000000000"));
    });

    it("numberMojitoToUpdate()", async function () {
        expect(await this.self.numberMojitoToUpdate()).to.be.bignumber.equal(new BN("2000000000000000000"));
    });

    it("addTeam(not owner)", async function () {
        await expectRevert(this.self.addTeam(
            "MojitoStar",
            "Somthing Special",
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it("addTeam(>20)", async function () {
        await expectRevert(this.self.addTeam(
            "012345678901234567890",
            "Somthing Special",
            {from: caller},
        ), "MojitoProfile::addTeam: Must be < 20");
    });

    it("addTeam(<3)", async function () {
        await expectRevert(this.self.addTeam(
            "01",
            "Somthing Special",
            {from: caller},
        ), "MojitoProfile::addTeam: Must be > 3");
    });

    it("addTeam()", async function () {
        await expectEvent(await this.self.addTeam(
            "MojitoStar",
            "Mojito To The Moon",
            {from: caller},
            ),
            "TeamAdd",
            {
                teamId:   "1",
                teamName: "MojitoStar",
            });

        await expectEvent(await this.self.addTeam(
            "MojitoStar2",
            "Mojito To The Moon2",
            {from: caller},
            ),
            "TeamAdd",
            {
                teamId:   "2",
                teamName: "MojitoStar2",
            });
    });

    it("getTeamProfile(Invalid)", async function () {
        await expectRevert(this.self.getTeamProfile(
            0,
        ), "MojitoProfile::getTeamProfile: Invalid teamId");
    });

    it("getTeamProfile(addTeam)", async function () {
        const data = await this.self.getTeamProfile(1);
        expect(data[0]).to.be.equal("MojitoStar");
        expect(data[1]).to.be.equal("Mojito To The Moon");
        expect(data[2]).to.be.bignumber.equal(new BN("0"));
        expect(data[3]).to.be.bignumber.equal(new BN("0"));
        expect(data[4]).to.be.equal(true);
    });

    it("renameTeam(not owner)", async function () {
        await expectRevert(this.self.renameTeam(
            1,
            "MojitoStar",
            "Somthing Special",
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it("renameTeam(Invalid)", async function () {
        await expectRevert(this.self.renameTeam(
            0,
            "MojitoStar",
            "Somthing Special",
            {from: caller},
        ), "MojitoProfile::renameTeam: Invalid teamId");
    });

    it("renameTeam(>20)", async function () {
        await expectRevert(this.self.renameTeam(
            1,
            "012345678901234567890",
            "Somthing Special",
            {from: caller},
        ), "MojitoProfile::renameTeam: Must be < 20");
    });

    it("renameTeam(<3)", async function () {
        await expectRevert(this.self.renameTeam(
            1,
            "01",
            "Somthing Special",
            {from: caller},
        ), "MojitoProfile::renameTeam: Must be > 3");
    });

    it("renameTeam()", async function () {
        await this.self.renameTeam(
            1,
            "MojitoStars",
            "Mojito To The Moons",
            {from: caller},
        );
    });

    it("getTeamProfile(renameTeam)", async function () {
        const data = await this.self.getTeamProfile(1);
        expect(data[0]).to.be.equal("MojitoStars");
        expect(data[1]).to.be.equal("Mojito To The Moons");
        expect(data[2]).to.be.bignumber.equal(new BN("0"));
        expect(data[3]).to.be.bignumber.equal(new BN("0"));
        expect(data[4]).to.be.equal(true);
    });

    it("makeTeamNotJoinable(not owner)", async function () {
        await expectRevert(this.self.makeTeamNotJoinable(
            1,
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it("makeTeamNotJoinable(Invalid)", async function () {
        await expectRevert(this.self.makeTeamNotJoinable(
            0,
            {from: caller},
        ), "MojitoProfile::makeTeamNotJoinable: Invalid teamId");
    });

    it("makeTeamNotJoinable()", async function () {
        await this.self.makeTeamNotJoinable(
            1,
            {from: caller},
        );
    });

    it("getTeamProfile(makeTeamNotJoinable)", async function () {
        const data = await this.self.getTeamProfile(1);
        expect(data[0]).to.be.equal("MojitoStars");
        expect(data[1]).to.be.equal("Mojito To The Moons");
        expect(data[2]).to.be.bignumber.equal(new BN("0"));
        expect(data[3]).to.be.bignumber.equal(new BN("0"));
        expect(data[4]).to.be.equal(false);
    });

    it("createProfile(not joinable)", async function () {
        await expectRevert(this.self.createProfile(
            1,
            this.mojitoNFT.address,
            1,
        ), "MojitoProfile::createProfile: Team not joinable");
    });

    it("makeTeamJoinable(not owner)", async function () {
        await expectRevert(this.self.makeTeamJoinable(
            1,
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it("makeTeamJoinable(Invalid)", async function () {
        await expectRevert(this.self.makeTeamJoinable(
            0,
            {from: caller},
        ), "MojitoProfile::makeTeamJoinable: Invalid teamId");
    });

    it("makeTeamJoinable()", async function () {
        await this.self.makeTeamJoinable(
            1,
            {from: caller},
        );
    });

    it("getTeamProfile(makeTeamJoinable)", async function () {
        const data = await this.self.getTeamProfile(1);
        expect(data[0]).to.be.equal("MojitoStars");
        expect(data[1]).to.be.equal("Mojito To The Moons");
        expect(data[2]).to.be.bignumber.equal(new BN("0"));
        expect(data[3]).to.be.bignumber.equal(new BN("0"));
        expect(data[4]).to.be.equal(true);
    });

    it("updateNumberMojito(not owner)", async function () {
        await expectRevert(this.self.updateNumberMojito(
            1,
            2,
            3,
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it("updateNumberMojito()", async function () {
        await this.self.updateNumberMojito(
            "2000000000000000000",
            "6000000000000000000",
            "4000000000000000000",
            {from: caller},
        );
    });

    it("numberMojitoToReactivate(updateNumberMojito)", async function () {
        expect(await this.self.numberMojitoToReactivate()).to.be.bignumber.equal(new BN("2000000000000000000"));
    });

    it("numberMojitoToRegister(updateNumberMojito)", async function () {
        expect(await this.self.numberMojitoToRegister()).to.be.bignumber.equal(new BN("6000000000000000000"));
    });

    it("numberMojitoToUpdate(updateNumberMojito)", async function () {
        expect(await this.self.numberMojitoToUpdate()).to.be.bignumber.equal(new BN("4000000000000000000"));
    });

    it("addNftAddress(not owner)", async function () {
        await expectRevert(this.self.addNftAddress(
            this.mojitoNFT.address,
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it.skip("addNftAddress(not 721)", async function () {
        await expectRevert(this.self.addNftAddress(
            this.mojitoToken.address,
            {from: caller},
        ), "MojitoProfile::addNftAddress: Not ERC721");
    });

    it("addNftAddress()", async function () {
        await expectEvent(await this.self.addNftAddress(
            this.mojitoNFT.address,
            {from: caller},
            ),
            "RoleGranted",
            {
                role:    await this.self.NFT_ROLE(),
                account: this.mojitoNFT.address,
                sender:  caller,
            });
    });

    it("createProfile(Invalid)", async function () {
        await expectRevert(this.self.createProfile(
            0,
            this.mojitoNFT.address,
            1,
        ), "MojitoProfile::createProfile: Invalid teamId");
    });

    it("reactivateProfile(not registered)", async function () {
        await expectRevert(this.self.reactivateProfile(
            this.mojitoNFT.address,
            1,
        ), "MojitoProfile::reactivateProfile: Has not registered");
    });

    it("createProfile(nft)", async function () {
        await expectRevert(this.self.createProfile(
            1,
            this.mojitoToken.address,
            1,
        ), "MojitoProfile::createProfile: NFT address invalid");
    });

    it("createProfile(not nft owner)", async function () {
        await expectRevert(this.self.createProfile(
            1,
            this.mojitoNFT.address,
            1,
        ), "MojitoProfile::createProfile: Only NFT owner can register");
    });

    it("createProfile()", async function () {
        await expectEvent(await this.self.createProfile(
            1,
            this.mojitoNFT.address,
            1,
            {from: caller},
            ),
            "UserNew",
            {
                userAddress: caller,
                teamId:      new BN("1"),
                nftAddress:  this.mojitoNFT.address,
                tokenId:     new BN("1"),
            });

        expect(await this.mojitoToken.balanceOf(caller)).to.be.bignumber.equal(new BN("94000000000000000000"));
        expect(await this.mojitoToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("6000000000000000000"));
        expect(await this.mojitoNFT.ownerOf(1)).to.be.equal(this.self.address);
    });

    it("reactivateProfile(is active)", async function () {
        await expectRevert(this.self.reactivateProfile(
            this.mojitoNFT.address,
            1,
            {from: caller},
        ), "MojitoProfile::reactivateProfile: User is active");
    });

    it("getUserProfile(not registered)", async function () {
        await expectRevert(this.self.getUserProfile(
            point,
        ), "MojitoProfile::getUserProfile: Has not registered");
    });

    it("getUserProfile(createProfile)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("0"));
        expect(data[2]).to.be.bignumber.equal(new BN("1"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("1"));
        expect(data[5]).to.be.equal(true);
    });

    it("getUserStatus(createProfile)", async function () {
        expect(await this.self.getUserStatus(caller)).to.be.equal(true);
    });

    it("createProfile(already registered)", async function () {
        await expectRevert(this.self.createProfile(
            1,
            this.mojitoNFT.address,
            1,
            {from: caller},
        ), "MojitoProfile::createProfile: Already registered");
    });

    it("pauseProfile(not registered)", async function () {
        await expectRevert(this.self.pauseProfile(
            {from: point},
        ), "MojitoProfile::pauseProfile: Has not registered");
    });

    it("pauseProfile()", async function () {
        await expectEvent(await this.self.pauseProfile(
            {from: caller},
            ),
            "UserPause",
            {
                userAddress: caller,
                teamId:      new BN("1"),
            });

        expect(await this.mojitoToken.balanceOf(caller)).to.be.bignumber.equal(new BN("94000000000000000000"));
        expect(await this.mojitoToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("6000000000000000000"));
        expect(await this.mojitoNFT.ownerOf(1)).to.be.equal(caller);
    });

    it("pauseProfile(not active)", async function () {
        await expectRevert(this.self.pauseProfile(
            {from: caller},
        ), "MojitoProfile::pauseProfile: User not active");
    });

    it("getUserProfile(pauseProfile)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("0"));
        expect(data[2]).to.be.bignumber.equal(new BN("1"));
        expect(data[3]).to.be.equal(constants.ZERO_ADDRESS);
        expect(data[4]).to.be.bignumber.equal(new BN("0"));
        expect(data[5]).to.be.equal(false);
    });

    it("getUserStatus(pauseProfile)", async function () {
        expect(await this.self.getUserStatus(caller)).to.be.equal(false);
    });

    it("updateProfile(not active)", async function () {
        await expectRevert(this.self.updateProfile(
            this.mojitoNFT.address,
            2,
            {from: caller},
        ), "MojitoProfile::updateProfile: User not active");
    });

    it("reactivateProfile(nft)", async function () {
        await expectRevert(this.self.reactivateProfile(
            this.mojitoToken.address,
            1,
            {from: caller},
        ), "MojitoProfile::reactivateProfile: NFT address invalid");
    });

    it("reactivateProfile(not nft owner)", async function () {
        await expectRevert(this.self.reactivateProfile(
            this.mojitoNFT.address,
            3,
            {from: caller},
        ), "MojitoProfile::reactivateProfile: Only NFT owner can update");
    });

    it("reactivateProfile()", async function () {
        await expectEvent(await this.self.reactivateProfile(
            this.mojitoNFT.address,
            1,
            {from: caller},
            ),
            "UserReactivate",
            {
                userAddress: caller,
                teamId:      new BN("1"),
                nftAddress:  this.mojitoNFT.address,
                tokenId:     new BN("1"),
            });

        expect(await this.mojitoToken.balanceOf(caller)).to.be.bignumber.equal(new BN("92000000000000000000"));
        expect(await this.mojitoToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("8000000000000000000"));
        expect(await this.mojitoNFT.ownerOf(1)).to.be.equal(this.self.address);
    });

    it("updateProfile(not registered)", async function () {
        await expectRevert(this.self.updateProfile(
            this.mojitoNFT.address,
            1,
        ), "MojitoProfile::updateProfile: Has not registered");
    });

    it("updateProfile(nft)", async function () {
        await expectRevert(this.self.updateProfile(
            this.mojitoToken.address,
            1,
            {from: caller},
        ), "MojitoProfile::updateProfile: NFT address invalid");
    });

    it("updateProfile(not nft owner)", async function () {
        await expectRevert(this.self.updateProfile(
            this.mojitoNFT.address,
            3,
            {from: caller},
        ), "MojitoProfile::updateProfile: Only NFT owner can update");
    });

    it("updateProfile()", async function () {
        await expectEvent(await this.self.updateProfile(
            this.mojitoNFT.address,
            2,
            {from: caller},
            ),
            "UserUpdate",
            {
                userAddress: caller,
                nftAddress:  this.mojitoNFT.address,
                tokenId:     new BN("2"),
            });

        expect(await this.mojitoToken.balanceOf(caller)).to.be.bignumber.equal(new BN("88000000000000000000"));
        expect(await this.mojitoToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("12000000000000000000"));
        expect(await this.mojitoNFT.ownerOf(1)).to.be.equal(caller);
        expect(await this.mojitoNFT.ownerOf(2)).to.be.equal(this.self.address);
    });

    it("getUserProfile(updateProfile)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("0"));
        expect(data[2]).to.be.bignumber.equal(new BN("1"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("2"));
        expect(data[5]).to.be.equal(true);
    });

    it("changeTeam(not owner)", async function () {
        await expectRevert(this.self.changeTeam(
            caller,
            2,
        ), "MojitoProfile::onlySpecial: Not a special admin");
    });

    it("changeTeam(not registered)", async function () {
        await expectRevert(this.self.changeTeam(
            special,
            2,
            {from: special},
        ), "MojitoProfile::changeTeam: Has not registered");
    });

    it("changeTeam(Invalid)", async function () {
        await expectRevert(this.self.changeTeam(
            caller,
            3,
            {from: special},
        ), "MojitoProfile::changeTeam: Invalid teamId");
    });

    it("changeTeam(not joinable)", async function () {
        await this.self.makeTeamNotJoinable(1, {from: caller});
        await expectRevert(this.self.changeTeam(
            caller,
            1,
            {from: special},
        ), "MojitoProfile::changeTeam: Team not joinable");
        await this.self.makeTeamJoinable(1, {from: caller});
    });

    it("changeTeam(in the team)", async function () {
        await expectRevert(this.self.changeTeam(
            caller,
            1,
            {from: special},
        ), "MojitoProfile::changeTeam: Already in the team");
    });

    it("changeTeam()", async function () {
        await expectEvent(await this.self.changeTeam(
            caller,
            2,
            {from: special},
            ),
            "UserChangeTeam",
            {
                userAddress: caller,
                oldTeamId:   new BN("1"),
                newTeamId:   new BN("2"),
            });
    });

    it("getUserProfile(changeTeam)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("0"));
        expect(data[2]).to.be.bignumber.equal(new BN("2"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("2"));
        expect(data[5]).to.be.equal(true);
    });

    it("claimFee(not owner)", async function () {
        await expectRevert(this.self.claimFee(
            1,
        ), "MojitoProfile::onlyOwner: Not the main admin");
    });

    it("claimFee()", async function () {
        await this.self.claimFee(
            "12000000000000000000",
            {from: caller},
        );

        expect(await this.mojitoToken.balanceOf(caller)).to.be.bignumber.equal(new BN("100000000000000000000"));
        expect(await this.mojitoToken.balanceOf(this.self.address)).to.be.bignumber.equal(new BN("0"));
    });

    it("increaseUserPoints(not point)", async function () {
        await expectRevert(this.self.increaseUserPoints(
            caller,
            100,
            1,
        ), "MojitoProfile::onlyPoint: Not a point admin");
    });

    it("increaseUserPoints()", async function () {
        await expectEvent(await this.self.increaseUserPoints(
            caller,
            100,
            1,
            {from: point},
            ),
            "UserPointIncrease",
            {
                userAddress:  caller,
                numberPoints: new BN("100"),
                campaignId:   new BN("1"),
            });
    });

    it("getUserProfile(increaseUserPoints)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("100"));
        expect(data[2]).to.be.bignumber.equal(new BN("2"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("2"));
        expect(data[5]).to.be.equal(true);
    });

    it("increaseUserPointsMultiple(not point)", async function () {
        await expectRevert(this.self.increaseUserPointsMultiple(
            [caller],
            100,
            1,
        ), "MojitoProfile::onlyPoint: Not a point admin");
    });

    it("increaseUserPointsMultiple(too long)", async function () {
        const list = [];
        for (let i = 0; i < 1002; i++) {
            list.push(caller);
        }
        await expectRevert(this.self.increaseUserPointsMultiple(
            list,
            100,
            1,
            {from: point},
        ), "MojitoProfile::increaseUserPointsMultiple: Length must be < 1001");
    });

    it("increaseUserPointsMultiple()", async function () {
        await expectEvent(await this.self.increaseUserPointsMultiple(
            [caller],
            100,
            1,
            {from: point},
            ),
            "UserPointIncreaseMultiple",
            {
                userAddresses: [caller],
                numberPoints:  new BN("100"),
                campaignId:    new BN("1"),
            });
    });

    it("getUserProfile(increaseUserPoints)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("200"));
        expect(data[2]).to.be.bignumber.equal(new BN("2"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("2"));
        expect(data[5]).to.be.equal(true);
    });

    it("removeUserPoints(not point)", async function () {
        await expectRevert(this.self.removeUserPoints(
            caller,
            100,
        ), "MojitoProfile::onlyPoint: Not a point admin");
    });

    it("removeUserPoints()", async function () {
        await this.self.removeUserPoints(
            caller,
            99,
            {from: point},
        );
    });

    it("getUserProfile(removeUserPoints)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("101"));
        expect(data[2]).to.be.bignumber.equal(new BN("2"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("2"));
        expect(data[5]).to.be.equal(true);
    });

    it("removeUserPointsMultiple(not point)", async function () {
        await expectRevert(this.self.removeUserPointsMultiple(
            [caller],
            101,
        ), "MojitoProfile::onlyPoint: Not a point admin");
    });

    it("removeUserPointsMultiple(too long)", async function () {
        const list = [];
        for (let i = 0; i < 1002; i++) {
            list.push(caller);
        }
        await expectRevert(this.self.removeUserPointsMultiple(
            list,
            101,
            {from: point},
        ), "MojitoProfile::removeUserPointsMultiple: Length must be < 1001");
    });

    it("removeUserPointsMultiple()", async function () {
        await this.self.removeUserPointsMultiple(
            [caller],
            100,
            {from: point},
        );
    });

    it("getUserProfile(removeUserPointsMultiple)", async function () {
        const data = await this.self.getUserProfile(caller);
        expect(data[0]).to.be.bignumber.equal(new BN("1"));
        expect(data[1]).to.be.bignumber.equal(new BN("1"));
        expect(data[2]).to.be.bignumber.equal(new BN("2"));
        expect(data[3]).to.be.equal(this.mojitoNFT.address);
        expect(data[4]).to.be.bignumber.equal(new BN("2"));
        expect(data[5]).to.be.equal(true);
    });

    it("increaseTeamPoints(not point)", async function () {
        await expectRevert(this.self.increaseTeamPoints(
            1,
            100,
            1,
        ), "MojitoProfile::onlyPoint: Not a point admin");
    });

    it("increaseTeamPoints()", async function () {
        await expectEvent(await this.self.increaseTeamPoints(
            2,
            100,
            1,
            {from: point},
            ),
            "TeamPointIncrease",
            {
                teamId:       new BN("2"),
                numberPoints: new BN("100"),
                campaignId:   new BN("1"),
            });
    });

    it("getTeamProfile(increaseTeamPoints)", async function () {
        const data = await this.self.getTeamProfile(2);
        expect(data[0]).to.be.equal("MojitoStar2");
        expect(data[1]).to.be.equal("Mojito To The Moon2");
        expect(data[2]).to.be.bignumber.equal(new BN("1"));
        expect(data[3]).to.be.bignumber.equal(new BN("100"));
        expect(data[4]).to.be.equal(true);
    });

    it("removeTeamPoints(not point)", async function () {
        await expectRevert(this.self.removeTeamPoints(
            1,
            100,
        ), "MojitoProfile::onlyPoint: Not a point admin");
    });

    it("removeTeamPoints()", async function () {
        await this.self.removeTeamPoints(
            2,
            99,
            {from: point},
        );
    });

    it("getTeamProfile(removeTeamPoints)", async function () {
        const data = await this.self.getTeamProfile(2);
        expect(data[0]).to.be.equal("MojitoStar2");
        expect(data[1]).to.be.equal("Mojito To The Moon2");
        expect(data[2]).to.be.bignumber.equal(new BN("1"));
        expect(data[3]).to.be.bignumber.equal(new BN("1"));
        expect(data[4]).to.be.equal(true);
    });

});
