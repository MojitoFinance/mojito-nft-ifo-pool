// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;


interface IVester {
  function setUserInfoForAccount(uint8 _pid, uint256 _offeringTokenAmount) external;
  function claim(uint8 _pid) external;
}