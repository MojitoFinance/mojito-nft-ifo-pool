// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IKRC20.sol";
import "./MojitoCattle.sol";

contract MojitoCattleFactory is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;
    using SafeERC20 for IKRC20;

    Counters.Counter private _cattleIds;
    IKRC20 public mojitoToken;
    MojitoCattle public mojitoCattle;
    mapping(uint256 => MojitoCattleCharacteristics) public mojitoCattleInformation;
    mapping(address => bool) public hasClaimed;

    struct MojitoCattleCharacteristics {
        uint256 cattleId;           // the nft cattle id
        string cattleName;          // the nft cattle name
        string cattleURI;           // the nft cattle uri
        uint256 mojitoPrice;        // number of MJTs a user needs to pay to acquire a nft
        uint256 startBlockNumber;   // the block where the purchase start
        uint256 endBlockNumber;     // the block where the purchase end
    }

    event CattleMint(address indexed to, uint256 indexed tokenId, uint256 indexed cattleId);
    event MojitoCattleCharacteristicsAdd(uint256 cattleId, string cattleName, string cattleURI, uint256 mojitoPrice, uint256 startBlockNumber, uint256 endBlockNumber);
    event MojitoPriceSet(uint256 cattleId, uint256 previousMojitoPrice, uint256 newMojitoPrice);
    event StartBlockNumberSet(uint256 cattleId, uint256 previousStartBlockNumber, uint256 newStartBlockNumber);
    event EndBlockNumberSet(uint256 cattleId, uint256 previousEndBlockNumber, uint256 newEndBlockNumber);
    event AdminTokenRecovery(address tokenAddress, uint256 amountTokens);

    constructor(IKRC20 _mojitoToken, MojitoCattle _mojitoCattle) public {
        mojitoToken = _mojitoToken;
        mojitoCattle = _mojitoCattle;
    }

    function addMojitoCattleInformation(string calldata _cattleName, string calldata _cattleURI, uint256 _mojitoPrice, uint256 _startBlockNumber, uint256 _endBlockNumber) external onlyOwner {
        // Verify length is between 3 and 20
        bytes memory strBytes = bytes(_cattleName);
        require(strBytes.length < 20, "MojitoCattleFactory::addMojitoCattleInformation: Must be < 20");
        require(strBytes.length > 3, "MojitoCattleFactory::addMojitoCattleInformation: Must be > 3");

        require(block.number < _startBlockNumber, "MojitoCattleFactory::addMojitoCattleInformation: New startBlock must be greater than currentBlock");
        require(_startBlockNumber < _endBlockNumber, "MojitoCattleFactory::addMojitoCattleInformation: New startBlock must be lower than new endBlock");

        // Increment the _cattleIds counter and get cattleId
        _cattleIds.increment();
        uint256 _cattleId = _cattleIds.current();

        // Set cattle name
        mojitoCattle.setCattleName(_cattleId, _cattleName);

        // Add new mojitoCattle data to the struct
        mojitoCattleInformation[_cattleId] = MojitoCattleCharacteristics({
        cattleId : _cattleId,
        cattleName : _cattleName,
        cattleURI : _cattleURI,
        mojitoPrice : _mojitoPrice,
        startBlockNumber : _startBlockNumber,
        endBlockNumber : _endBlockNumber
        });

        emit MojitoCattleCharacteristicsAdd(_cattleId, _cattleName, _cattleURI, _mojitoPrice, _startBlockNumber, _endBlockNumber);
    }

    function setMojitoPrice(uint256 _cattleId, uint256 _mojitoPrice) external onlyOwner {
        require((_cattleId <= _cattleIds.current()) && (_cattleId > 0), "MojitoCattleFactory::setMojitoPrice: Invalid cattleId");

        // Set mojitoCattle data to the struct
        MojitoCattleCharacteristics storage mojitoCattleCharacteristics = mojitoCattleInformation[_cattleId];
        uint256 _previousMojitoPrice = mojitoCattleCharacteristics.mojitoPrice;
        mojitoCattleCharacteristics.mojitoPrice = _mojitoPrice;

        emit MojitoPriceSet(_cattleId, _previousMojitoPrice, _mojitoPrice);
    }

    function setStartBlockNumber(uint256 _cattleId, uint256 _startBlockNumber) external onlyOwner {
        require((_cattleId <= _cattleIds.current()) && (_cattleId > 0), "MojitoCattleFactory::setStartBlockNumber: Invalid cattleId");
        require(block.number < _startBlockNumber, "MojitoCattleFactory::setStartBlockNumber: New startBlock must be greater than currentBlock");

        // Set mojitoCattle data to the struct
        MojitoCattleCharacteristics storage mojitoCattleCharacteristics = mojitoCattleInformation[_cattleId];
        require(_startBlockNumber < mojitoCattleCharacteristics.endBlockNumber, "MojitoCattleFactory::setStartBlockNumber: New startBlock must be lower than endBlock");
        uint256 _previousStartBlockNumber = mojitoCattleCharacteristics.startBlockNumber;
        mojitoCattleCharacteristics.startBlockNumber = _startBlockNumber;

        emit StartBlockNumberSet(_cattleId, _previousStartBlockNumber, _startBlockNumber);
    }

    function setEndBlockNumber(uint256 _cattleId, uint256 _endBlockNumber) external onlyOwner {
        require((_cattleId <= _cattleIds.current()) && (_cattleId > 0), "MojitoCattleFactory::setEndBlockNumber: Invalid cattleId");
        require(block.number < _endBlockNumber, "MojitoCattleFactory::setEndBlockNumber: New endBlock must be greater than currentBlock");

        // Set mojitoCattle data to the struct
        MojitoCattleCharacteristics storage mojitoCattleCharacteristics = mojitoCattleInformation[_cattleId];
        require(mojitoCattleCharacteristics.startBlockNumber < _endBlockNumber, "MojitoCattleFactory::setEndBlockNumber: New endBlock must be greater than startBlock");
        uint256 _previousEndBlockNumber = mojitoCattleCharacteristics.endBlockNumber;
        mojitoCattleCharacteristics.endBlockNumber = _endBlockNumber;

        emit EndBlockNumberSet(_cattleId, _previousEndBlockNumber, _endBlockNumber);
    }

    function claimFee(uint256 _amount) external onlyOwner {
        mojitoToken.safeTransfer(_msgSender(), _amount);
    }

    /**
     * @notice It allows the admin to recover wrong tokens sent to the contract
     * @param _tokenAddress: the address of the token to withdraw
     * @param _tokenAmount: the number of token amount to withdraw
     * @dev This function is only callable by admin.
     */
    function recoverWrongTokens(address _tokenAddress, uint256 _tokenAmount) external onlyOwner {
        require(_tokenAddress != address(mojitoToken), "MojitoCattleFactory::recoverWrongTokens: Cannot be mojito token");

        IKRC20(_tokenAddress).safeTransfer(address(msg.sender), _tokenAmount);

        emit AdminTokenRecovery(_tokenAddress, _tokenAmount);
    }

    /**
     * @dev Mint NFTs.
     * Users can specify what cattleId they want to mint. Users can claim once.
     */
    function mintNFT(uint256 _cattleId) external nonReentrant {
        require((_cattleId <= _cattleIds.current()) && (_cattleId > 0), "MojitoCattleFactory::mintNFT: Invalid cattleId");
        MojitoCattleCharacteristics memory mojitoCattleCharacteristics = mojitoCattleInformation[_cattleId];

        // Check that mojitoCattle was set
        require(mojitoCattleCharacteristics.mojitoPrice > 0 && mojitoCattleCharacteristics.startBlockNumber > 0 && mojitoCattleCharacteristics.endBlockNumber > 0, "MojitoCattleFactory::mintNFT: MojitoCattleCharacteristics not set");

        // Check _msgSender() has not claimed
        address senderAddress = _msgSender();
        require(!hasClaimed[senderAddress], "MojitoCattleFactory::mintNFT: Has claimed");

        // Check blockNumber
        require(block.number > mojitoCattleCharacteristics.startBlockNumber, "MojitoCattleFactory::mintNFT: Too early");
        require(block.number < mojitoCattleCharacteristics.endBlockNumber, "MojitoCattleFactory::mintNFT: Too late");

        // Update that _msgSender() has claimed
        hasClaimed[senderAddress] = true;

        // Send MJT tokens and mint NFT
        mojitoToken.safeTransferFrom(senderAddress, address(this), mojitoCattleCharacteristics.mojitoPrice);
        uint256 tokenId = mojitoCattle.mint(senderAddress, mojitoCattleCharacteristics.cattleURI, _cattleId);

        emit CattleMint(senderAddress, tokenId, _cattleId);
    }

    function canMint(address user) external view returns (bool) {
        return !hasClaimed[user];
    }
}