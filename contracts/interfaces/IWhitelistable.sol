// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

interface IWhitelistable {
    /**
     * @dev Checks if account is whitelisted
     * @param _account The address to check
     */
    function isWhitelisted(address _account) external view returns (bool);
}