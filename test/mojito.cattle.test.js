const {
          accounts,
          contract,
      }            = require("@openzeppelin/test-environment");
const {
          BN,
          expectRevert,
      }            = require("@openzeppelin/test-helpers");
const {expect}     = require("chai");
const MojitoCattle = contract.fromArtifact("MojitoCattle");


describe("MojitoCattle", function () {
    const [caller] = accounts;
    before(async function () {
        this.self = await MojitoCattle.new("ipfs://", {from: caller});
    });

    it("name()", async function () {
        expect(await this.self.name()).to.be.equal("Mojito Cattle");
    });

    it("symbol()", async function () {
        expect(await this.self.symbol()).to.be.equal("MC");
    });

    it("pause(not pauser)", async function () {
        await expectRevert(this.self.pause(), "MojitoCattle::onlyPauser: Not the pauser admin");
    });

    it("pause", async function () {
        await this.self.pause({from: caller});
    });

    it("paused", async function () {
        await expectRevert(this.self.mint(caller, "1", 1, {from: caller}), "ERC721Pausable: token transfer while paused");
    });

    it("unpause(not pauser)", async function () {
        await expectRevert(this.self.unpause(), "MojitoCattle::onlyPauser: Not the pauser admin");
    });

    it("unpause", async function () {
        await this.self.unpause({from: caller});
    });

    it("mint(not minter)", async function () {
        await expectRevert(this.self.mint(caller, "dabbler.json", 1), "MojitoCattle::onlyMinter: Not the minter admin");
    });

    it("mint", async function () {
        await this.self.mint(caller, "hash/dabbler.json", 1, {from: caller});
        await this.self.mint(caller, "hash/highballer.json", 2, {from: caller});
        await this.self.mint(caller, "hash/apprentice.json", 3, {from: caller});
        await this.self.mint(caller, "hash/dionysian.json", 4, {from: caller});
        await this.self.mint(caller, "hash/dooze-o-phile.json", 5, {from: caller});
    });

    it("cattleCount()", async function () {
        expect(await this.self.cattleCount(1)).to.be.bignumber.equal(new BN("1"));
        expect(await this.self.cattleCount(2)).to.be.bignumber.equal(new BN("1"));
        expect(await this.self.cattleCount(3)).to.be.bignumber.equal(new BN("1"));
        expect(await this.self.cattleCount(4)).to.be.bignumber.equal(new BN("1"));
        expect(await this.self.cattleCount(5)).to.be.bignumber.equal(new BN("1"));
    });

    it("setCattleName(not minter)", async function () {
        await expectRevert(this.self.setCattleName(1, "10"), "MojitoCattle::onlyMinter: Not the minter admin");
    });

    it("setCattleName", async function () {
        await this.self.setCattleName(1, "Dabbler", {from: caller});
        await this.self.setCattleName(2, "Highballer", {from: caller});
        await this.self.setCattleName(3, "Apprentice", {from: caller});
        await this.self.setCattleName(4, "Dionysian", {from: caller});
        await this.self.setCattleName(5, "Booze-o-phile", {from: caller});
    });

    it("getCattleId()", async function () {
        expect(await this.self.getCattleId(1)).to.be.bignumber.equal(new BN("1"));
        expect(await this.self.getCattleId(2)).to.be.bignumber.equal(new BN("2"));
        expect(await this.self.getCattleId(3)).to.be.bignumber.equal(new BN("3"));
        expect(await this.self.getCattleId(4)).to.be.bignumber.equal(new BN("4"));
        expect(await this.self.getCattleId(5)).to.be.bignumber.equal(new BN("5"));
    });

    it("getCattleName()", async function () {
        expect(await this.self.getCattleName(1)).to.be.equal("Dabbler");
        expect(await this.self.getCattleName(2)).to.be.equal("Highballer");
        expect(await this.self.getCattleName(3)).to.be.equal("Apprentice");
        expect(await this.self.getCattleName(4)).to.be.equal("Dionysian");
        expect(await this.self.getCattleName(5)).to.be.equal("Booze-o-phile");
    });

    it("getCattleNameOfTokenId()", async function () {
        expect(await this.self.getCattleNameOfTokenId(1)).to.be.equal("Dabbler");
        expect(await this.self.getCattleNameOfTokenId(2)).to.be.equal("Highballer");
        expect(await this.self.getCattleNameOfTokenId(3)).to.be.equal("Apprentice");
        expect(await this.self.getCattleNameOfTokenId(4)).to.be.equal("Dionysian");
        expect(await this.self.getCattleNameOfTokenId(5)).to.be.equal("Booze-o-phile");
    });

    it("burn(not owner)", async function () {
        await expectRevert(this.self.burn(1), "MojitoCattle::onlyOwner: Not the owner admin");
    });

    it("burn", async function () {
        await this.self.burn(1, {from: caller});
    });

    it("cattleBurnCount()", async function () {
        expect(await this.self.cattleBurnCount(1)).to.be.bignumber.equal(new BN("1"));
        expect(await this.self.cattleBurnCount(2)).to.be.bignumber.equal(new BN("0"));
        expect(await this.self.cattleBurnCount(3)).to.be.bignumber.equal(new BN("0"));
        expect(await this.self.cattleBurnCount(4)).to.be.bignumber.equal(new BN("0"));
        expect(await this.self.cattleBurnCount(5)).to.be.bignumber.equal(new BN("0"));
    });

});
