import { parseAbi } from "viem";

export const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const PONS_ROUTER_ABI = parseAbi([
  "function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[] memory amounts)",
  "function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)",
  "function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] memory amounts)",
  "function buy(address token, uint256 minTokensOut) payable returns (uint256 tokensBought)",
  "function sell(address token, uint256 tokenAmount, uint256 minEthOut) returns (uint256 ethBought)",
]);

export const PONS_BONDING_CURVE_ABI = parseAbi([
  "function token() view returns (address)",
  "function creator() view returns (address)",
  "function ethBalance() view returns (uint256)",
  "function tokenBalance() view returns (uint256)",
  "function isGraduated() view returns (bool)",
  "function getEthForTokens(uint256 tokens) view returns (uint256)",
  "function getTokensForEth(uint256 ethAmount) view returns (uint256)",
  "function buy() payable returns (uint256)",
  "function sell(uint256 amount) returns (uint256)",
  "event CurveBuy(address indexed buyer, uint256 ethIn, uint256 tokensOut)",
  "event CurveSell(address indexed seller, uint256 tokensIn, uint256 ethOut)",
  "event CurveGraduated(address indexed token, uint256 totalEthCollected)",
]);
