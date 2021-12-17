// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IKRC20 is IERC20 {
    /**
     * @dev Returns the token name.
     */
    function name() external view returns (string memory);

    /**
    * @dev Returns the token symbol.
    */
    function symbol() external view returns (string memory);

    /**
    * @dev Returns the token decimals.
    */
    function decimals() external view returns (uint8);

}