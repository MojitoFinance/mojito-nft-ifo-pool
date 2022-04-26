// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IVester {
  function claimable(address _user) external view returns (uint256, bool);
  function setUserInfoForAccount(address _user, uint256 _offeringTokenAmount) external;
  function claim() external;
}
