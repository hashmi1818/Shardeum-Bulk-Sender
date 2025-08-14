
export type SendMode = 'SHM' | 'ERC20';

export interface Recipient {
  address: string;
  amount: string;
  id: string; // for unique key in React lists
}

export interface LogEntry {
  id: number;
  message: string;
  status: 'info' | 'success' | 'error' | 'pending';
  txHash?: string;
}

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}
