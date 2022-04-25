// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IVester.sol";
import "./interfaces/IKRC20.sol";

contract Vester is IVester, ReentrancyGuard, Ownable {
  using SafeERC20 for IKRC20;

  uint256 public claimTime;
  bool public claimStatus;

  // The address of the offeringToken
  address public offeringToken;

  // It maps the address to pool id to UserInfo
  mapping(address => UserInfo) private _userInfo;
  mapping(address => bool) public isHandler;

  // Struct that contains each user information
  struct UserInfo {
    uint256 offeringTokenAmount; // How many offering tokens the user has provided for pool
    bool claimedPool; // Whether the user has claimed (default: false) for pool
  }

  event OfferingTokenSet(address offeringToken);

  event NewClaimTime(uint256 claimTime);

  event NewClaimStatus(bool claimStatus);

  event UserInfoSet(address indexed user, uint256 indexed offeringTokenAmount, bool claimedPool);

  event Claim(address indexed receiver, uint256 indexed amount);

  // Admin recovers token
  event AdminTokenRecovery(address indexed tokenRecovered, uint256 amount);

  // Modifier to prevent contracts to participate
  modifier notContract() {
    require(!_isContract(msg.sender), "Vester::notContract: Contract not allowed");
    require(msg.sender == tx.origin, "Vester::notContract: Proxy contract not allowed");
    _;
  }

  /**
   * @dev Throws if called by IFOInitializable contract.
   */
  modifier onlyHandler() {
    require(isHandler[msg.sender], "Vester: forbidden");
    _;
  }

  /**
   * @notice Constructor
   * @param _offeringToken: the token that is offered for the IFO
   * @param _handler: the address of the IFOInitializable
   */
  constructor(address _offeringToken, address _handler) public {
    offeringToken = _offeringToken;
    isHandler[_handler] = true;
    claimStatus = false;
  }

  /**
   * @notice It allows the admin to update IFOInitializable address
   * @param _handler: IFOInitializable contract address
   * @param _isActive: true means the operation is allowed
   */
  function setHandler(address _handler, bool _isActive) external onlyOwner {
    isHandler[_handler] = _isActive;
  }

  /**
   * @notice It allows the admin to update set claim time
   * @param _claimTime: the new claim time
   * @dev This function is only callable by admin.
   */
  function setClaimTime(uint256 _claimTime) external onlyOwner {
    require(
      block.timestamp < _claimTime,
      "Vester::setClaimTime: New claim time must be higher than current timestamp"
    );

    claimTime = _claimTime;
    emit NewClaimTime(_claimTime);
  }

  /**
   * @notice It allows the admin to update set claim status
   * @param _claimStatus: the new claim status, true means that the user can claim
   * @dev This function is only callable by admin.
   */
  function setClaimStatus(bool _claimStatus) external onlyOwner {
    claimStatus = _claimStatus;
    emit NewClaimStatus(_claimStatus);
  }


  /**
   * @notice It allows users to set offering token
   * @param _offeringToken: the token that is offered for the IFO
   * @dev This function is only callable by admin.
   */
  function setOfferingToken(address _offeringToken) external onlyOwner {
    offeringToken = _offeringToken;
    emit OfferingTokenSet(_offeringToken);
  }

  /**
   * @notice It allows ifo initializable contract to set user info
   * @param _user: user who participate in ifo
   * @param _offeringTokenAmount: the offering amount of user to be claimed in the pool
   * @dev This function is only callable by initializable contract.
   */
  function setUserInfoForAccount(address _user, uint256 _offeringTokenAmount) external override onlyHandler {
    _userInfo[_user].offeringTokenAmount = _offeringTokenAmount;
    emit UserInfoSet(_user, _offeringTokenAmount, _userInfo[_user].claimedPool);
  }

  /**
   * @notice It returns the user information
   * @param _user: user
   * @return offeringTokenAmount: the offering amount of user to be claimed in the pool
   * @return claimedPool: whether the user has claimed
   */
  function claimable(address _user) external view override returns (uint256, bool){
    return (
    _userInfo[_user].offeringTokenAmount,
    _userInfo[_user].claimedPool
    );
  }

  /**
   * @notice It allows users to claim from pool
   */
  function claim() external override nonReentrant notContract {
    // Check if the claim is allowed
    require(claimStatus || (block.timestamp > claimTime && claimTime > 0), "Vester: No claims allowed at current time");

    address _account = msg.sender;

    // Checks whether the user has participated
    require(_userInfo[_account].offeringTokenAmount > 0, "Vester::claim: Did not participate");

    // Checks whether the user has already claimed
    require(!_userInfo[_account].claimedPool, "Vester::claim: Already done");

    _userInfo[_account].claimedPool = true;

    uint256 _amount = _userInfo[_account].offeringTokenAmount;

    IKRC20(offeringToken).safeTransfer(_account, _amount);

    emit Claim(_account, _amount);
  }

  /**
   * @notice Check if an address is a contract
   */
  function _isContract(address _addr) internal view returns (bool) {
    uint256 size;
    assembly {
      size := extcodesize(_addr)
    }
    return size > 0;
  }

  /**
   * @notice It allows the admin to recover wrong tokens sent to the contract
   * @param _tokenAddress: the address of the token to withdraw
   * @dev This function is only callable by admin.
   */
  function recoverWrongTokens(address _tokenAddress) external onlyOwner {
    uint256 balanceToRecover = IKRC20(_tokenAddress).balanceOf(address(this));
    require(balanceToRecover > 0, "Vester::recoverWrongTokens: Balance must be > 0");
    IKRC20(_tokenAddress).safeTransfer(address(msg.sender), balanceToRecover);

    emit AdminTokenRecovery(_tokenAddress, balanceToRecover);
  }
}
