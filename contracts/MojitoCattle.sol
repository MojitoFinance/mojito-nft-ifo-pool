// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol";

/** @title MojitoCattle.
@dev Mojito cattle came with their friends.
     As the first NFT on MojitoSwap,
     it also brought us some exciting products,
     just enjoy it.
*/
contract MojitoCattle is AccessControl, ERC721Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Map the number of tokens per cattleId
    mapping(uint256 => uint256) public cattleCount;

    // Map the number of tokens burnt per cattleId
    mapping(uint256 => uint256) public cattleBurnCount;

    // Used for generating the tokenId of new NFT minted
    Counters.Counter private _tokenIds;

    // Map the cattleId for each tokenId
    mapping(uint256 => uint256) private cattleIds;

    // Map the cattleName for a cattleId
    mapping(uint256 => string) private cattleNames;

    // Modifier for owner roles
    modifier onlyOwner() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "MojitoCattle::onlyOwner: Not the owner admin");
        _;
    }

    // Modifier for minter roles
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "MojitoCattle::onlyMinter: Not the minter admin");
        _;
    }

    // Modifier for pauser roles
    modifier onlyPauser() {
        require(hasRole(PAUSER_ROLE, _msgSender()), "MojitoCattle::onlyPauser: Not the pauser admin");
        _;
    }

    constructor(string memory _baseURI) public ERC721("Mojito Cattle", "MC") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setBaseURI(_baseURI);
    }

    function pause() public virtual onlyPauser {
        _pause();
    }

    function unpause() public virtual onlyPauser {
        _unpause();
    }

    /**
     * @dev Get cattleId for a specific tokenId.
     */
    function getCattleId(uint256 _tokenId) external view returns (uint256) {
        return cattleIds[_tokenId];
    }

    /**
     * @dev Get the associated cattleName for a specific cattleId.
     */
    function getCattleName(uint256 _cattleId) external view returns (string memory) {
        return cattleNames[_cattleId];
    }

    /**
     * @dev Get the associated cattleName for a unique tokenId.
     */
    function getCattleNameOfTokenId(uint256 _tokenId) external view returns (string memory) {
        uint256 cattleId = cattleIds[_tokenId];

        return cattleNames[cattleId];
    }

    /**
     * @dev Mint NFTs. Only the minter can call it.
     */
    function mint(address _to, string calldata _tokenURI, uint256 _cattleId) external onlyMinter returns (uint256) {
        _tokenIds.increment();
        uint256 newId = _tokenIds.current();

        cattleIds[newId] = _cattleId;
        cattleCount[_cattleId] = cattleCount[_cattleId].add(1);

        _mint(_to, newId);
        _setTokenURI(newId, _tokenURI);

        return newId;
    }

    /**
     * @dev Set a unique name for each cattleId. It is supposed to be called once.
     */
    function setCattleName(uint256 _cattleId, string calldata _name) external onlyMinter {
        cattleNames[_cattleId] = _name;
    }

    /**
     * @dev Burn a NFT token. Callable by owner only.
     */
    function burn(uint256 _tokenId) external onlyOwner {
        uint256 cattleIdBurnt = cattleIds[_tokenId];

        cattleCount[cattleIdBurnt] = cattleCount[cattleIdBurnt].sub(1);
        cattleBurnCount[cattleIdBurnt] = cattleBurnCount[cattleIdBurnt].add(1);

        _burn(_tokenId);
    }
}