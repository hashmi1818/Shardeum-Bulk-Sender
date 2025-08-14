
import { NetworkConfig } from './types';

export const SHARDEUM_NETWORK_CONFIG: NetworkConfig = {
  chainId: '0x1f90', // 8080
  chainName: 'Shardeum UnstableNet',
  nativeCurrency: {
    name: 'Shardeum',
    symbol: 'SHM',
    decimals: 18,
  },
  rpcUrls: ['https://api-unstable.shardeum.org'],
  blockExplorerUrls: ['https://explorer-unstable.shardeum.org'],
};

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];
