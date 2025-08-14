
import { ethers } from 'ethers';
import { Recipient } from '../types';

export const shortenAddress = (address: string) => {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const parseRecipients = (input: string): { valid: Recipient[], errors: string[] } => {
    const lines = input.split('\n').filter(line => line.trim() !== '');
    const recipientsMap = new Map<string, string>();
    const errors: string[] = [];

    lines.forEach((line, index) => {
        const [rawAddress, rawAmount] = line.split(/[ ,;\t]+/).map(s => s.trim());

        if (!rawAddress || !rawAmount) {
            // Silently ignore empty lines
            return;
        }

        if (!ethers.isAddress(rawAddress)) {
            errors.push(`Line ${index + 1}: Invalid address format for '${rawAddress}'.`);
            return;
        }

        const amount = parseFloat(rawAmount);
        if (isNaN(amount) || amount <= 0) {
            errors.push(`Line ${index + 1}: Invalid amount '${rawAmount}' for address ${shortenAddress(rawAddress)}. Must be a positive number.`);
            return;
        }
        
        const normalizedAddress = ethers.getAddress(rawAddress);
        if (recipientsMap.has(normalizedAddress)) {
            errors.push(`Line ${index + 1}: Duplicate address found: ${shortenAddress(normalizedAddress)}. Keeping the last entry.`);
        }
        recipientsMap.set(normalizedAddress, rawAmount);
    });

    const valid: Recipient[] = Array.from(recipientsMap.entries()).map(([address, amount], i) => ({
        address,
        amount,
        id: `${address}-${i}`,
    }));

    return { valid, errors };
};

export const formatBigInt = (value: bigint, decimals: number): string => {
    const formatted = ethers.formatUnits(value, decimals);
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts.length > 1) {
        parts[1] = parts[1].slice(0, 4); // Show up to 4 decimal places
    }
    return parts.join('.');
};
