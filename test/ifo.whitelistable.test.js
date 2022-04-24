const {
          accounts,
          contract,
      }                = require("@openzeppelin/test-environment");
const {
          expectRevert,
      }                = require("@openzeppelin/test-helpers");
const {expect}         = require("chai");
const Whitelistable = contract.fromArtifact("Whitelistable");

describe("Whitelistable", function () {
    const [caller, other] = accounts;
    before(async function () {
        this.self = await Whitelistable.new({from: caller});
        expect(await this.self.owner()).to.be.equal(caller);
    });

    it("addAddressToWhitelist(not owner)", async function () {
        await expectRevert(this.self.addAddressToWhitelist(
            caller,
            {from: other}
        ), "Ownable: caller is not the owner");
        expect(await this.self.isWhitelisted(caller)).to.be.equal(false);
    });

    it("addAddressesToWhitelist(not owner)", async function () {
        await expectRevert(this.self.addAddressesToWhitelist(
            [caller],
            {from: other}
        ), "Ownable: caller is not the owner");
    });

    it("addAddressToWhitelist()", async function () {
        expect(await this.self.isWhitelisted(caller)).to.be.equal(false);
        await this.self.addAddressToWhitelist(
            caller,
            {from: caller}
        );
        expect(await this.self.isWhitelisted(caller)).to.be.equal(true);
    });

    it("addAddressesToWhitelist()", async function () {
        expect(await this.self.isWhitelisted(other)).to.be.equal(false);
        await this.self.addAddressesToWhitelist(
            [caller,other],
            {from: caller}
        );
        expect(await this.self.isWhitelisted(other)).to.be.equal(true);
    });

    it("removeAddressFromWhitelist(not owner)", async function () {
        await expectRevert(this.self.removeAddressFromWhitelist(
            caller,
            {from: other}
        ), "Ownable: caller is not the owner");
        expect(await this.self.isWhitelisted(caller)).to.be.equal(true);
    });

    it("removeAddressesFromWhitelist(not owner)", async function () {
        await expectRevert(this.self.removeAddressesFromWhitelist(
            [caller],
            {from: other}
        ), "Ownable: caller is not the owner");
        expect(await this.self.isWhitelisted(caller)).to.be.equal(true);
    });

    it("removeAddressFromWhitelist()", async function () {
        expect(await this.self.isWhitelisted(caller)).to.be.equal(true);
        await this.self.removeAddressFromWhitelist(
            caller,
            {from: caller}
        );
        expect(await this.self.isWhitelisted(caller)).to.be.equal(false);
    });

    it("removeAddressesFromWhitelist()", async function () {
        expect(await this.self.isWhitelisted(other)).to.be.equal(true);
        await this.self.removeAddressesFromWhitelist(
            [caller,other],
            {from: caller}
        );
        expect(await this.self.isWhitelisted(other)).to.be.equal(false);
    });
});
