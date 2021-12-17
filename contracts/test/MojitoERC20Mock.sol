// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MojitoERC20Mock is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) public {
        //
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function setupDecimals(uint8 decimals) public {
        _setupDecimals(decimals);
    }

}