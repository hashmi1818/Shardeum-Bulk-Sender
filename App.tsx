
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { SendMode, Recipient, LogEntry } from './types';
import { SHARDEUM_NETWORK_CONFIG, ERC20_ABI } from './constants';
import { shortenAddress, parseRecipients, formatBigInt } from './utils/helpers';
import { WalletIcon, CheckCircleIcon, XCircleIcon, InfoIcon, SpinnerIcon, ExternalLinkIcon } from './components/icons';

// Add a global declaration for window.ethereum to fix TypeScript errors.
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Helper component for individual log entries
const LogItem: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    const icon = useMemo(() => {
        switch (entry.status) {
            case 'success': return <CheckCircleIcon className="h-5 w-5 text-emerald-400" />;
            case 'error': return <XCircleIcon className="h-5 w-5 text-red-400" />;
            case 'pending': return <SpinnerIcon className="h-5 w-5 text-amber-400" />;
            default: return <InfoIcon className="h-5 w-5 text-blue-400" />;
        }
    }, [entry.status]);

    const statusColor = useMemo(() => {
        switch (entry.status) {
            case 'success': return 'border-l-emerald-500 bg-emerald-500/10';
            case 'error': return 'border-l-red-500 bg-red-500/10';
            case 'pending': return 'border-l-amber-500 bg-amber-500/10';
            default: return 'border-l-blue-500 bg-blue-500/10';
        }
    }, [entry.status]);

    return (
        <div className={`flex items-start space-x-3 p-4 border-l-4 ${statusColor} rounded-r-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]`}>
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1">
                <p className="text-gray-200 font-medium">{entry.message}</p>
                {entry.txHash && (
                    <a
                        href={`${SHARDEUM_NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-xs inline-flex items-center mt-2 transition-colors duration-200 hover:underline"
                    >
                        View on Explorer <ExternalLinkIcon className="h-3 w-3 ml-1" />
                    </a>
                )}
            </div>
        </div>
    );
};

// Enhanced card component
const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
    <div className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl ${className}`}>
        {title && (
            <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
        )}
        <div className="p-6 pt-0">
            {children}
        </div>
    </div>
);

// Enhanced button component
const Button: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}> = ({ children, onClick, disabled = false, variant = 'primary', size = 'md', className = '' }) => {
    const baseClasses = "font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:transform-none disabled:cursor-not-allowed inline-flex items-center justify-center";
    
    const variantClasses = {
        primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-500/25",
        secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg",
        success: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-emerald-500/25",
        danger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-red-500/25"
    };
    
    const sizeClasses = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children}
        </button>
    );
};

export default function App() {
    const [sendMode, setSendMode] = useState<SendMode>('SHM');
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [shmBalance, setShmBalance] = useState<bigint>(BigInt(0));
    
    const [tokenAddress, setTokenAddress] = useState<string>('');
    const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
    const [tokenSymbol, setTokenSymbol] = useState<string>('');
    const [tokenDecimals, setTokenDecimals] = useState<number>(18);
    const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));

    const [recipientInput, setRecipientInput] = useState<string>('');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const addLog = useCallback((message: string, status: LogEntry['status'], txHash?: string, id?: number) => {
        setLogs(prev => [{ id: id ?? Date.now() + Math.random(), message, status, txHash }, ...prev]);
    }, []);

    const updateLog = useCallback((logId: number, message: string, status: LogEntry['status'], txHash?: string) => {
        setLogs(prev => prev.map(log => 
            log.id === logId 
            ? { ...log, message, status, txHash: txHash ?? log.txHash } 
            : log
        ));
    }, []);

    const switchOrAddNetwork = useCallback(async (prov: ethers.BrowserProvider) => {
        try {
            await prov.send('wallet_switchEthereumChain', [{ chainId: SHARDEUM_NETWORK_CONFIG.chainId }]);
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                try {
                    await prov.send('wallet_addEthereumChain', [SHARDEUM_NETWORK_CONFIG]);
                } catch (addError) {
                    addLog('Failed to add Shardeum UnstableNet to MetaMask.', 'error');
                }
            } else {
                addLog('Failed to switch network. Please switch to Shardeum UnstableNet manually.', 'error');
            }
        }
    }, [addLog]);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            addLog('MetaMask not detected. Please install it.', 'error');
            return;
        }
        try {
            setIsLoading(true);
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            
            const network = await browserProvider.getNetwork();
            if (network.chainId.toString() !== BigInt(SHARDEUM_NETWORK_CONFIG.chainId).toString()) {
                await switchOrAddNetwork(browserProvider);
            }
            
            const newSigner = await browserProvider.getSigner();
            const newAccount = await newSigner.getAddress();
            const balance = await browserProvider.getBalance(newAccount);

            setProvider(browserProvider);
            setSigner(newSigner);
            setAccount(newAccount);
            setShmBalance(balance);
            addLog('Wallet connected successfully.', 'success');
        } catch (error) {
            console.error(error);
            addLog('Failed to connect wallet.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addLog, switchOrAddNetwork]);

    const fetchTokenData = useCallback(async () => {
        if (!ethers.isAddress(tokenAddress) || !signer || !provider) return;
        
        try {
            setIsLoading(true);
            addLog(`Fetching data for token: ${shortenAddress(tokenAddress)}`, 'info');
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
            
            const [name, symbol, decimals, balance] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.balanceOf(account)
            ]);

            setTokenContract(contract);
            setTokenSymbol(symbol);
            setTokenDecimals(Number(decimals));
            setTokenBalance(balance);
            addLog(`Successfully loaded ${name} (${symbol}).`, 'success');
        } catch (error) {
            console.error("Failed to fetch token data:", error);
            addLog('Failed to fetch token data. Check address and network.', 'error');
            setTokenContract(null);
            setTokenSymbol('');
            setTokenBalance(BigInt(0));
        } finally {
            setIsLoading(false);
        }
    }, [tokenAddress, signer, provider, account, addLog]);

    useEffect(() => {
        if (tokenAddress) {
            fetchTokenData();
        }
    }, [tokenAddress, fetchTokenData]);
    
     useEffect(() => {
        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                setAccount(null);
                setSigner(null);
                addLog('Wallet disconnected.', 'info');
            } else {
                connectWallet();
            }
        };

        const handleChainChanged = () => {
            connectWallet();
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [connectWallet, addLog]);

    const handleParseInput = useCallback(() => {
        const { valid, errors } = parseRecipients(recipientInput);
        setRecipients(valid);
        if (errors.length > 0) {
            errors.forEach(err => addLog(err, 'error'));
        }
        if (valid.length > 0) {
            addLog(`Parsed ${valid.length} valid recipients. Ready for review.`, 'info');
        }
    }, [recipientInput, addLog]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const text = await file.text();
            setRecipientInput(text);
            addLog(`Loaded recipients from ${file.name}. Click 'Parse Input' to process.`, 'info');
        }
    };

    const totalToSend = useMemo(() => {
        return recipients.reduce((sum, r) => sum + ethers.parseEther(r.amount), BigInt(0));
    }, [recipients]);

    const totalTokensToSend = useMemo(() => {
        if (!tokenDecimals) return BigInt(0);
        return recipients.reduce((sum, r) => {
            try {
                return sum + ethers.parseUnits(r.amount, tokenDecimals);
            } catch {
                return sum;
            }
        }, BigInt(0));
    }, [recipients, tokenDecimals]);
    
    const canSend = useMemo(() => {
        if (!recipients.length || isSending) return false;
        if (sendMode === 'SHM') return shmBalance >= totalToSend;
        if (sendMode === 'ERC20') return tokenContract && tokenBalance >= totalTokensToSend;
        return false;
    }, [recipients, isSending, sendMode, shmBalance, totalToSend, tokenContract, tokenBalance, totalTokensToSend]);

    const handleSendTransactions = async () => {
        if (!signer || !provider || !canSend) {
            addLog('Cannot send. Check connection, recipients, and balance.', 'error');
            return;
        }

        setIsSending(true);
        addLog(`Initiating batch send for ${recipients.length} recipients.`, 'info');
        addLog('Please approve each transaction in your wallet as it appears.', 'info');
        
        const confirmationPromises: Promise<any>[] = [];
        let submittedCount = 0;

        for (const recipient of recipients) {
            const logId = Date.now() + Math.random();
            const { address, amount } = recipient;
            const tokenName = sendMode === 'SHM' ? 'SHM' : tokenSymbol;

            addLog(`[Queued] Sending ${amount} ${tokenName} to ${shortenAddress(address)}...`, 'pending', undefined, logId);

            try {
                let txPromise: Promise<ethers.TransactionResponse>;
                if (sendMode === 'SHM') {
                    const value = ethers.parseEther(amount);
                    txPromise = signer.sendTransaction({ to: address, value });
                } else {
                    const value = ethers.parseUnits(amount, tokenDecimals);
                    txPromise = tokenContract!.transfer(address, value);
                }

                updateLog(logId, `[Waiting for signature] Sending ${amount} ${tokenName} to ${shortenAddress(address)}...`, 'pending');
                
                const tx = await txPromise;
                submittedCount++;

                updateLog(logId, `[Submitted] Sending ${amount} ${tokenName} to ${shortenAddress(address)}... (Awaiting confirmation)`, 'pending', tx.hash);

                const confirmation = tx.wait().then(receipt => {
                    updateLog(logId, `Successfully sent ${amount} ${tokenName} to ${shortenAddress(address)}.`, 'success', receipt.hash);
                    return { status: 'success', address };
                }).catch(error => {
                    const message = error.reason || error.message || 'Transaction failed on-chain.';
                    updateLog(logId, `Failed to send to ${shortenAddress(address)}: ${message}`, 'error', tx.hash);
                    return Promise.reject({ status: 'error', address, error });
                });
                
                confirmationPromises.push(confirmation);

            } catch (error: any) {
                const isRejection = error.code === 'ACTION_REJECTED';
                const message = isRejection ? 'Transaction rejected by user.' : `An error occurred: ${error.message}.`;
                updateLog(logId, `Failed to send to ${shortenAddress(address)}: ${message}`, 'error');
                
                if (isRejection) {
                    addLog('Batch sending aborted due to user rejection.', 'error');
                    break; 
                }
            }
        }
        
        if (submittedCount > 0) {
            addLog(`All ${submittedCount} transactions have been signed and submitted.`, 'info');
            addLog('Confirmations are processing in the background. You can monitor their status in the log.', 'info');
            addLog('IMPORTANT: Please wait for confirmations to complete before starting a new batch to avoid issues.', 'error');
        }
        
        // Re-enable the UI immediately after the signing process is complete.
        setIsSending(false);

        if (confirmationPromises.length > 0) {
            // Handle confirmations in the background
            Promise.allSettled(confirmationPromises).then(async (results) => {
                let successCount = 0;
                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        successCount++;
                    }
                });
                const failCount = confirmationPromises.length - successCount;

                addLog(`Batch confirmation complete. Success: ${successCount}, Failed: ${failCount}.`, 'info');
                
                if (account && provider) {
                    addLog('Refreshing balances...', 'info');
                    try {
                        const newShmBalance = await provider.getBalance(account);
                        setShmBalance(newShmBalance);
                        if (tokenContract && sendMode === 'ERC20') {
                            const newTokenBalance = await tokenContract.balanceOf(account);
                            setTokenBalance(newTokenBalance);
                        }
                        addLog('Balances updated.', 'success');
                    } catch {
                        addLog('Could not refresh balances.', 'error');
                    }
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-200 font-sans relative overflow-x-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Enhanced Header */}
                    <header className="flex flex-col sm:flex-row justify-between items-center mb-12">
                        <div className="text-center sm:text-left mb-6 sm:mb-0">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/25">
                                <img src="/logo.png" alt="Shardeum Logo" className="h-10 w-10 object-contain" />
                            </div>
                            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                                Shardeum <span className="text-indigo-400">Bulk Sender</span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl">
                                Send native SHM tokens and ERC-20 tokens to multiple addresses efficiently on the Shardeum network
                            </p>
                        </div>
                        
                        {/* Wallet Connection Section */}
                        <div className="flex-shrink-0">
                            {!account ? (
                                <Button
                                    onClick={connectWallet}
                                    disabled={isLoading}
                                    size="lg"
                                    className="shadow-2xl shadow-indigo-500/25"
                                >
                                    {isLoading ? (
                                        <>
                                            <SpinnerIcon className="h-6 w-6 mr-3"/>
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <WalletIcon className="h-6 w-6 mr-3"/>
                                            Connect Wallet
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <div className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                                        <span className="font-mono text-lg font-bold text-white">{shortenAddress(account)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-gray-800/50 rounded-xl p-3">
                                            <p className="text-gray-400 text-sm mb-1">SHM Balance</p>
                                            <p className="text-xl font-bold text-emerald-400">{formatBigInt(shmBalance, 18)}</p>
                                        </div>
                                        {sendMode === 'ERC20' && tokenSymbol && (
                                            <div className="bg-gray-800/50 rounded-xl p-3">
                                                <p className="text-sm mb-1 text-gray-400">{tokenSymbol} Balance</p>
                                                <p className="text-xl font-bold text-blue-400">{formatBigInt(tokenBalance, tokenDecimals)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>
                    
                    <main className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Left Column: Configuration */}
                        <div className="space-y-6">
                            {/* Send Mode Selection */}
                            <Card title="1. Select Send Mode">
                                <div className="flex bg-gray-900/50 p-1.5 rounded-xl border border-gray-700/50">
                                    <button 
                                        onClick={() => setSendMode('SHM')} 
                                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                            sendMode === 'SHM' 
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                        }`}
                                    >
                                        Native SHM
                                    </button>
                                    <button 
                                        onClick={() => setSendMode('ERC20')} 
                                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                                            sendMode === 'ERC20' 
                                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                        }`}
                                    >
                                        ERC-20 Token
                                    </button>
                                </div>
                            </Card>

                            {/* Token Contract Input */}
                            {sendMode === 'ERC20' && (
                                <Card title="2. Token Contract">
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={tokenAddress}
                                            onChange={(e) => setTokenAddress(e.target.value)}
                                            placeholder="Enter ERC-20 contract address (0x...)"
                                            className="w-full bg-gray-900/70 border border-gray-600/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all duration-200 font-mono text-sm placeholder-gray-500"
                                        />
                                        {tokenSymbol && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                                <p className="text-emerald-400 text-sm font-medium">✓ Token loaded: {tokenSymbol}</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Recipients Input */}
                            <Card title={`${sendMode === 'ERC20' ? '3.' : '2.'} Recipients & Amounts`}>
                                <div className="space-y-4">
                                    <textarea
                                        value={recipientInput}
                                        onChange={(e) => setRecipientInput(e.target.value)}
                                        placeholder="Format: address, amount to send&#10;&#10;Examples:&#10;0x1234...5678, 100&#10;0xabcd...efgh, 25.5&#10;0x9876...4321, 50.75"
                                        rows={6}
                                        className="w-full bg-gray-900/70 border border-gray-600/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none transition-all duration-200 font-mono text-sm placeholder-gray-500 resize-none"
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button onClick={handleParseInput} variant="secondary" size="md" className="flex-1">
                                            Parse Input
                                        </Button>
                                        <label className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer text-center shadow-lg">
                                            Upload CSV/TXT
                                            <input type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </Card>

                            {/* Recipients Review */}
                            {recipients.length > 0 && (
                                <Card title={`Review Recipients (${recipients.length})`}>
                                    <div className="space-y-4">
                                        <div className="max-h-48 overflow-y-auto bg-gray-900/50 rounded-xl border border-gray-700/50">
                                            {recipients.map((r) => (
                                                <div key={r.id} className="flex justify-between items-center p-3 border-b border-gray-700/30 last:border-b-0 hover:bg-gray-800/30 transition-colors duration-200">
                                                    <span className="font-mono text-gray-300">{shortenAddress(r.address)}</span>
                                                    <span className="font-semibold text-indigo-300">{r.amount} {sendMode === 'SHM' ? 'SHM' : tokenSymbol}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Transaction Summary */}
                                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-6 rounded-xl border border-gray-700/50">
                                            <h3 className="text-lg font-bold text-white mb-4">Transaction Summary</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-300">Total to Send:</span>
                                                    <span className="font-mono font-bold text-2xl text-indigo-300">
                                                        {sendMode === 'SHM' ? formatBigInt(totalToSend, 18) : formatBigInt(totalTokensToSend, tokenDecimals)} {sendMode === 'SHM' ? 'SHM' : tokenSymbol}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-400">
                                                    <span>Your Balance:</span>
                                                    <span className="font-mono font-semibold">
                                                        {sendMode === 'SHM' ? formatBigInt(shmBalance, 18) : formatBigInt(tokenBalance, tokenDecimals)}
                                                    </span>
                                                </div>
                                                <div className="pt-3 border-t border-gray-700/50">
                                                    <p className="text-xs text-gray-500 leading-relaxed">
                                                        Note: You will be prompted to sign each transaction sequentially. Once all signatures are complete, the batch is submitted. Please wait for confirmations before starting a new batch.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Send Button */}
                                        <Button
                                            onClick={handleSendTransactions}
                                            disabled={!canSend || isSending}
                                            variant="success"
                                            size="lg"
                                            className="w-full shadow-2xl shadow-emerald-500/25"
                                        >
                                            {isSending ? (
                                                <>
                                                    <SpinnerIcon className="h-6 w-6 mr-3"/>
                                                    Waiting for Signatures...
                                                </>
                                            ) : (
                                                `Send to ${recipients.length} addresses`
                                            )}
                                        </Button>
                                        
                                        {!canSend && !isSending && (
                                            <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <p className="text-red-400 text-sm font-medium">
                                                    Cannot send. Insufficient balance or invalid configuration.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Right Column: Transaction Log */}
                        <Card title="Transaction Log" className="flex flex-col h-fit">
                            <div className="flex-grow bg-gray-900/50 rounded-xl border border-gray-700/50 h-96 xl:h-auto overflow-y-auto">
                                {logs.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-500 p-8">
                                        <div className="text-center">
                                            <InfoIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                                            <p className="text-lg font-medium">No transactions yet</p>
                                            <p className="text-sm">Connect your wallet and start sending to see logs here</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 p-2">
                                        {logs.map(log => <LogItem key={log.id} entry={log} />)}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </main>
                </div>
            </div>
            
            {/* Footer */}
            <footer className="relative z-10 mt-16 py-8 border-t border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">
                            Made with ❤️ by{' '}
                            <a 
                                href="https://x.com/hashmi1818" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200 hover:underline"
                            >
                                HASHMI
                            </a>
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                            Built for the Shardeum ecosystem
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
