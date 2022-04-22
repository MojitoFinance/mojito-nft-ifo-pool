// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IWhitelistable.sol";

contract Whitelistable is IWhitelistable, Ownable {
    mapping(address => bool) internal whitelisted;

    event AddedWhitelist(address indexed _account);
    event RemovedWhitelist(address indexed _account);

    /**
     * @dev Checks if account is whitelisted
     * @param _account The address to check
     */
    function isWhitelisted(address _account) external view override returns (bool) {
        return whitelisted[_account];
    }

    /**
     * @dev Adds account to whitelist
     * @param _account The address to whitelist
     */
    function addAddressToWhitelist(address _account) external onlyOwner {
        _addWhitelistInternal(_account);
    }

    /**
     * @dev Adds account to whitelist
     * @param _accounts The addresses to whitelist
     */
    function addAddressesToWhitelist(address[] calldata _accounts) external onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            _addWhitelistInternal(_accounts[i]);
        }
    }

    function _addWhitelistInternal(address _account) internal {
        whitelisted[_account] = true;
        emit AddedWhitelist(_account);
    }

    /**
     * @dev Removes account from whitelist
     * @param _account The address to remove from the whitelist
     */
    function removeAddressFromWhitelist(address _account) external onlyOwner {
        _removeWhitelistInternal(_account);
    }

    /**
     * @dev Removes account from whitelist
     * @param _accounts The addresses to remove from the whitelist
     */
    function removeAddressesFromWhitelist(address[] calldata _accounts) external onlyOwner {
        for (uint256 i = 0; i < _accounts.length; i++) {
            _removeWhitelistInternal(_accounts[i]);
        }
    }

    function _removeWhitelistInternal(address _account) internal {
        whitelisted[_account] = false;
        emit RemovedWhitelist(_account);
    }
}