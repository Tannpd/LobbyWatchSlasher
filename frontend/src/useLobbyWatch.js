import { useState, useCallback, useEffect } from 'react';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

let _readClient = null;

function getReadClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet });
  }
  return _readClient;
}

function getWriteClient(account) {
  return createClient({ chain: studionet, account });
}

// Convert Wei (u256) to human readable GEN string
export function formatGen(weiVal) {
  if (!weiVal) return '0';
  try {
    const big = BigInt(weiVal);
    const integerPart = big / 10n**18n;
    const fractionalPart = big % 10n**18n;
    let fractionStr = fractionalPart.toString().padStart(18, '0');
    fractionStr = fractionStr.replace(/0+$/, ''); // Trim trailing zeros
    if (fractionStr === '') {
      return integerPart.toString();
    }
    return `${integerPart}.${fractionStr.slice(0, 4)}`;
  } catch (e) {
    return '0';
  }
}

// Convert human readable GEN input to Wei (u256 BigInt)
export function parseGen(genVal) {
  if (!genVal || genVal.toString().trim() === '') return 0n;
  try {
    const parts = genVal.toString().split('.');
    let integerPart = parts[0] || '0';
    let fractionalPart = parts[1] || '';
    fractionalPart = fractionalPart.slice(0, 18).padEnd(18, '0');
    return BigInt(integerPart) * 10n**18n + BigInt(fractionalPart);
  } catch (e) {
    return 0n;
  }
}

export function useLobbyWatch() {
  const [address, setAddress] = useState('');
  const [glAccount, setGlAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // Connect Wallet (MetaMask/ethereum provider or fallback ephemeral account)
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const addr = accounts[0].toLowerCase();
        setAddress(addr);
        setGlAccount(addr);
      } else {
        // Ephemeral account fallback
        let savedKey = localStorage.getItem('__lobbywatch_sk');
        let acct;
        if (savedKey) {
          acct = createAccount(savedKey);
        } else {
          acct = createAccount();
          localStorage.setItem('__lobbywatch_sk', acct.privateKey);
        }
        const addr = acct.address.toLowerCase();
        setAddress(addr);
        setGlAccount(acct);
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError('Wallet connection failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all campaign escrows and contract balance
  const fetchCampaignsState = useCallback(async () => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return;
    setLoading(true);
    try {
      const client = getReadClient();
      
      // Get the number of campaigns
      const rawCount = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: 'get_campaigns_count',
        args: [],
      });
      const count = Number(rawCount);
      
      const fetchedCampaigns = [];
      for (let i = 0; i < count; i++) {
        const rawCampaign = await client.readContract({
          address: CONTRACT_ADDRESS,
          functionName: 'get_campaign',
          args: [i],
        });
        if (rawCampaign && rawCampaign !== '{}') {
          const campaignObj = JSON.parse(rawCampaign);
          fetchedCampaigns.push(campaignObj);
        }
      }
      
      // Get balance of contract (pool balance)
      const rawBalance = await client.getBalance({ address: CONTRACT_ADDRESS });
      setContractBalance(rawBalance.toString());
      
      setCampaigns(fetchedCampaigns.reverse()); // Show newest first
      setError('');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to fetch campaigns: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create Campaign Escrow (Lock GEN for a politician)
  const createCampaign = async (politicianAddress, depositAmt) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Deploying ${depositAmt} GEN into Campaign Escrow for politician ${politicianAddress}...`);

    try {
      const client = getWriteClient(glAccount);
      const valueWei = parseGen(depositAmt);
      
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'create_campaign',
        args: [politicianAddress.trim()],
        value: valueWei,
      });
      
      setTxHash(hash);
      setTxStatus('Submitting transaction. Depositing funds into Campaign Escrow...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus('Success! Campaign fund created successfully.');
      await fetchCampaignsState();
      return receipt;
    } catch (err) {
      console.error('Campaign creation failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Release Campaign Escrow (Manual release to politician)
  const releaseCampaign = async (campaignId) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Releasing campaign escrow #${campaignId} to politician...`);

    try {
      const client = getWriteClient(glAccount);
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'release_campaign',
        args: [Number(campaignId)],
      });
      
      setTxHash(hash);
      setTxStatus('Submitting release transaction...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Contract execution error';
        throw new Error(errorMsg);
      }

      setTxStatus('Success! Campaign funds released to politician.');
      await fetchCampaignsState();
      return receipt;
    } catch (err) {
      console.error('Release campaign failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Audit Legislation (AI Anti-Corruption Forensic Plagiarism Audit)
  const auditLegislation = async (campaignId, billDraftUrl, lobbyistDocumentUrl) => {
    if (!glAccount || !CONTRACT_ADDRESS) {
      throw new Error('Wallet not connected');
    }
    setLoading(true);
    setError('');
    setTxHash('');
    setTxStatus(`Triggering Anti-Corruption Legislative Radar on Campaign #${campaignId}...`);

    try {
      const client = getWriteClient(glAccount);
      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: 'audit_legislation',
        args: [Number(campaignId), billDraftUrl.trim(), lobbyistDocumentUrl.trim()],
      });
      
      setTxHash(hash);
      setTxStatus('AI Legislative Radar scraping bill draft and lobbyist memos. Performing forensic semantic comparison. Please wait 15-30s...');

      const receipt = await client.waitForTransactionReceipt({ hash });
      
      const leaderReceipt = receipt.consensus_data?.leader_receipt?.[0];
      if (leaderReceipt && leaderReceipt.execution_result === 'ERROR') {
        const errorMsg = leaderReceipt.genvm_result?.stderr || 'Legislation audit error';
        throw new Error(errorMsg);
      }

      setTxStatus('Radar scan complete! Anti-corruption consensus finalized.');
      await fetchCampaignsState();
      return receipt;
    } catch (err) {
      console.error('Audit legislation failed:', err);
      setError(err.message || 'Transaction failed');
      setTxStatus('Failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      fetchCampaignsState();
    }
  }, [CONTRACT_ADDRESS, address, fetchCampaignsState]);

  return {
    address,
    campaigns,
    contractBalance,
    loading,
    error,
    txHash,
    txStatus,
    connectWallet,
    fetchCampaignsState,
    createCampaign,
    releaseCampaign,
    auditLegislation,
    contractAddress: CONTRACT_ADDRESS,
  };
}
