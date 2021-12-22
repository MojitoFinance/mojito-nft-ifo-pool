// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/IKRC20.sol";
import "./IFOInitializable.sol";

/**
 * @title IFODeployer
 */
contract IFODeployer is Ownable {
    using SafeERC20 for IKRC20;

    uint256 public constant MAX_BUFFER_BLOCKS = 5184000;

    address public immutable mojitoProfile;

    event AdminTokenRecovery(address indexed tokenRecovered, uint256 amount);
    event NewIFOContract(address indexed ifoAddress);

    /**
     * @notice Constructor
     * @param _mojitoProfile: the address of the MojitoProfile
     */
    constructor(address _mojitoProfile) public {
        mojitoProfile = _mojitoProfile;
    }

    /**
     * @notice It creates the IFO contract and initializes the contract.
     * @param _lpToken: the LP token used
     * @param _offeringToken: the token that is offered for the IFO
     * @param _startBlock: the start block for the IFO
     * @param _endBlock: the end block for the IFO
     * @param _adminAddress: the admin address for handling tokens
     */
    function createIFO(
        address _lpToken,
        address _offeringToken,
        uint256 _startBlock,
        uint256 _endBlock,
        address _adminAddress
    ) external onlyOwner {
        require(IKRC20(_lpToken).totalSupply() >= 0);
        require(IKRC20(_offeringToken).totalSupply() >= 0);
        require(_lpToken != _offeringToken, "IFODeployer::createIFO: Tokens must be different");
        require(_endBlock < (block.number + MAX_BUFFER_BLOCKS), "IFODeployer::createIFO: EndBlock too far");
        require(_startBlock < _endBlock, "IFODeployer::createIFO: StartBlock must be inferior to endBlock");
        require(_startBlock > block.number, "IFODeployer::createIFO: StartBlock must be greater than current block");

        bytes memory bytecode = type(IFOInitializable).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(_lpToken, _offeringToken, _startBlock));
        address ifoAddress;

        assembly {
            ifoAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        IFOInitializable(ifoAddress).initialize(
            _lpToken,
            _offeringToken,
            mojitoProfile,
            _startBlock,
            _endBlock,
            MAX_BUFFER_BLOCKS,
            _adminAddress
        );

        emit NewIFOContract(ifoAddress);
    }

    /**
     * @notice It allows the admin to recover wrong tokens sent to the contract
     * @param _tokenAddress: the address of the token to withdraw
     * @dev This function is only callable by admin.
     */
    function recoverWrongTokens(address _tokenAddress) external onlyOwner {
        uint256 balanceToRecover = IKRC20(_tokenAddress).balanceOf(address(this));
        require(balanceToRecover > 0, "IFODeployer::recoverWrongTokens: Balance must be > 0");
        IKRC20(_tokenAddress).safeTransfer(address(msg.sender), balanceToRecover);

        emit AdminTokenRecovery(_tokenAddress, balanceToRecover);
    }
}