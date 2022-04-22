// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/IVester.sol";
import "./interfaces/IKRC20.sol";

contract Vester is IVester, ReentrancyGuard, Ownable {
  using SafeERC20 for IKRC20;

  // Number of pools
  uint8 public constant NUMBER_POOLS = 2;
  uint256 public vestingTime;

  // The address of the offeringToken
  address public offeringToken;

  // It maps the address to pool id to UserInfo
  mapping(address => mapping(uint8 => UserInfo)) private _userInfo;
  mapping(address => bool) public isHandler;

  // Struct that contains each user information for both pools
  struct UserInfo {
    uint256 offeringTokenAmount; // How many offering tokens the user has provided for pool
    bool claimedPool; // Whether the user has claimed (default: false) for pool
  }

  event OfferingTokenSet(address _offeringToken);

  event NewVestingTime(uint256 _vestingTime);

  event UserInfoSet(uint256 indexed _offeringTokenAmount, bool _claimedPool, uint8 indexed pid);

  event Claim(address receiver, uint256 amount, uint8 pid);

  // Admin recovers token
  event AdminTokenRecovery(address indexed tokenRecovered, uint256 amount);

  /**
   * @dev Modifier to make a function callable only when claim is allowed.
   */
  modifier whenVested() {
    require(block.timestamp > vestingTime, "Vester: claim time must be greater than vesting time");
    _;
  }

  // Modifier to prevent contracts to participate
  modifier notContract() {
    require(!_isContract(msg.sender), "Vester::notContract: Contract not allowed");
    require(msg.sender == tx.origin, "Vester::notContract: Proxy contract not allowed");
    _;
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
   * @notice It allows the admin to update set vesting time
   * @param _vestingTime: the new vesting time
   * @dev This function is only callable by admin.
   */
  function setVestingTime(uint256 _vestingTime) external onlyOwner {
    require(
      block.timestamp < _vestingTime,
      "Vester::setVestingTime: New vestingTime must be higher than current timestamp"
    );

    vestingTime = _vestingTime;

    emit NewVestingTime(_vestingTime);
  }

  function setOfferingToken(address _offeringToken) external onlyOwner {
    offeringToken = _offeringToken;
    emit OfferingTokenSet(_offeringToken);
  }

  function setUserInfoForAccount(uint8 _pid, uint256 _offeringTokenAmount) external override  {
    _validateHandler();
    _userInfo[msg.sender][_pid].offeringTokenAmount = _offeringTokenAmount;
    emit UserInfoSet(_offeringTokenAmount, _userInfo[msg.sender][_pid].claimedPool, _pid);
  }

  /**
   * @notice It allows users to claim from pool
   * @param _pid: pool id
   */
  function claim(uint8 _pid) external override nonReentrant notContract whenVested {
    address _account = msg.sender;

    // Checks whether pool id is valid
    require(_pid < NUMBER_POOLS, "Vester: Non valid pool id");

    // Checks whether the user has participated
    require(_userInfo[_account][_pid].offeringTokenAmount > 0, "Vester::claim: Did not participate");

    // Checks whether the user has already claimed
    require(!_userInfo[_account][_pid].claimedPool, "Vester::claim: Already done");

    _userInfo[_account][_pid].claimedPool = true;

    uint256 _amount = _userInfo[_account][_pid].offeringTokenAmount;

    IKRC20(offeringToken).safeTransfer(address(this), _amount);

    emit Claim(_account, _amount, _pid);
  }

  function _validateHandler() private view {
    require(isHandler[msg.sender], "Vester: forbidden");
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
