import React, { useState, useEffect, useRef } from 'react';
import { useLobbyWatch, formatGen } from './useLobbyWatch';
import { 
  Lock, 
  Unlock, 
  FileText, 
  AlertTriangle, 
  RotateCw, 
  Scale, 
  Coins, 
  ExternalLink,
  Terminal,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Search,
  Eye
} from 'lucide-react';

// Preset mock URLs for legislative anti-corruption audit
const PRESET_CORRUPT_TAX_BILL = 'https://raw.githubusercontent.com/genlayer/radar-presets/main/government/tax_loophole_bill.txt';
const PRESET_CORRUPT_TAX_MEMO = 'https://raw.githubusercontent.com/genlayer/radar-presets/main/lobbyists/corporate_tax_thinktank_memo.txt';

const PRESET_CORRUPT_ENERGY_BILL = 'https://raw.githubusercontent.com/genlayer/radar-presets/main/government/oil_subsidy_exemptions.txt';
const PRESET_CORRUPT_ENERGY_MEMO = 'https://raw.githubusercontent.com/genlayer/radar-presets/main/lobbyists/coal_lobby_draft_guidelines.txt';

const PRESET_CLEAN_EDUCATION_BILL = 'https://raw.githubusercontent.com/genlayer/radar-presets/main/government/clean_education_bill.txt';
const PRESET_CLEAN_EDUCATION_MEMO = 'https://raw.githubusercontent.com/genlayer/radar-presets/main/lobbyists/education_advocacy_memo.txt';

export default function App() {
  const {
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
    contractAddress
  } = useLobbyWatch();

  // Selected campaign for the Surveillance Scan panel
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  // Form states
  const [politicianInput, setPoliticianInput] = useState('');
  const [depositInput, setDepositInput] = useState('15.0');
  
  const [billUrlInput, setBillUrlInput] = useState('');
  const [lobbyistUrlInput, setLobbyistUrlInput] = useState('');

  // Diagnostic log terminal
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [typedEvidence, setTypedEvidence] = useState('');
  const evidenceTimerRef = useRef(null);

  const addConsoleLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setConsoleLogs((prev) => [{ time, msg }, ...prev]);
  };

  // Redacted text animation wrapper
  const renderRedactedText = (text) => {
    if (!text) return null;
    const words = text.split(' ');
    return words.map((word, idx) => {
      // Redact approximately 20% of words longer than 3 characters, dynamically
      const shouldRedact = (idx % 5 === 2 || idx % 8 === 4) && word.length > 3;
      if (shouldRedact) {
        return (
          <span key={idx} className="redacted-reveal" style={{ marginRight: '4px' }}>
            {word}
          </span>
        );
      }
      return <span key={idx} style={{ marginRight: '4px' }}>{word}</span>;
    });
  };

  // Diagnostic logs on initialization
  useEffect(() => {
    addConsoleLog('LOBBYWATCH RADAR SYSTEM initialized.');
    addConsoleLog('Intelligence consensus validator: READY.');
    if (contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      addConsoleLog(`Connected Legislative Escrow Contract: ${contractAddress}`);
    } else {
      addConsoleLog('Warning: Awaiting contract deployment.');
    }
  }, [contractAddress]);

  useEffect(() => {
    if (address) {
      addConsoleLog(`Watchdog terminal authenticated. Actor: ${address}`);
    }
  }, [address]);

  useEffect(() => {
    if (txStatus) {
      addConsoleLog(`[INTEL LOG] ${txStatus}`);
    }
    if (error) {
      addConsoleLog(`[WARNING DECREED] ${error}`);
    }
  }, [txStatus, error]);

  // Set initial selected campaign
  useEffect(() => {
    if (campaigns.length > 0 && selectedCampaignId === null) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  const activeCampaign = campaigns.find((c) => Number(c.id) === Number(selectedCampaignId));

  // Typewriter effect for evidence analysis report
  useEffect(() => {
    if (evidenceTimerRef.current) {
      clearInterval(evidenceTimerRef.current);
    }
    setTypedEvidence('');

    if (activeCampaign && activeCampaign.evidence_analysis) {
      const fullText = activeCampaign.evidence_analysis;
      let currentIndex = 0;
      
      evidenceTimerRef.current = setInterval(() => {
        if (currentIndex < fullText.length) {
          setTypedEvidence((prev) => prev + fullText[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(evidenceTimerRef.current);
        }
      }, 6);
    }

    return () => {
      if (evidenceTimerRef.current) {
        clearInterval(evidenceTimerRef.current);
      }
    };
  }, [selectedCampaignId, activeCampaign?.evidence_analysis]);

  // Load sandbox presets
  const loadPreset = (type) => {
    if (type === 'tax_corruption') {
      setBillUrlInput(PRESET_CORRUPT_TAX_BILL);
      setLobbyistUrlInput(PRESET_CORRUPT_TAX_MEMO);
      addConsoleLog('Loaded Corporate Tax Loophole preset.');
    } else if (type === 'energy_corruption') {
      setBillUrlInput(PRESET_CORRUPT_ENERGY_BILL);
      setLobbyistUrlInput(PRESET_CORRUPT_ENERGY_MEMO);
      addConsoleLog('Loaded Oil & Coal Lobby Subsidy preset.');
    } else {
      setBillUrlInput(PRESET_CLEAN_EDUCATION_BILL);
      setLobbyistUrlInput(PRESET_CLEAN_EDUCATION_MEMO);
      addConsoleLog('Loaded clean public education funding preset.');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!address) {
      addConsoleLog('Authentication required. Connect your wallet.');
      return;
    }
    if (!politicianInput || !depositInput) {
      addConsoleLog('Please complete all form fields.');
      return;
    }
    try {
      addConsoleLog(`Locking campaign donations: ${depositInput} GEN. Target Politician: ${politicianInput}...`);
      await createCampaign(politicianInput, depositInput);
      addConsoleLog('Campaign escrow locked on GenLayer Studio Ledger.');
      setPoliticianInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseCampaign = async (cid) => {
    try {
      addConsoleLog(`Releasing locked donations for Campaign Escrow #${cid} to the politician...`);
      await releaseCampaign(cid);
      addConsoleLog(`Campaign #${cid} successfully released.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuditLegislation = async (e) => {
    e.preventDefault();
    if (!activeCampaign) return;
    if (!billUrlInput || !lobbyistUrlInput) {
      addConsoleLog('Both government bill and lobbyist document URLs are required.');
      return;
    }
    try {
      addConsoleLog(`Activating Legislative Plagiarism Radar on Campaign Escrow #${activeCampaign.id}...`);
      await auditLegislation(activeCampaign.id, billUrlInput, lobbyistUrlInput);
      addConsoleLog(`Anti-corruption audit finalized for Campaign Escrow #${activeCampaign.id}.`);
      setBillUrlInput('');
      setLobbyistUrlInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const truncateAddr = (addr) => {
    if (!addr) return '0x0';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': 
        return <span className="status-tag tag-active">Active Radar</span>;
      case 'AUDITING': 
        return <span className="status-tag tag-disputed">Auditing...</span>;
      case 'RELEASED': 
        return <span className="status-tag tag-released">Released</span>;
      case 'SLASHED': 
        return <span className="status-tag tag-refunded">Slashed (Corrupt)</span>;
      case 'FAILED': 
        return <span className="status-tag tag-failed">Audit Failed</span>;
      default: 
        return <span className="status-tag">{status}</span>;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <div className="header-logo-spin"></div>
              <Activity className="header-logo-icon" size={18} />
            </div>
            <div className="header-title-wrapper">
              <h1 className="header-title">
                LobbyWatch <span>Slasher</span>
              </h1>
              <p className="header-subtitle">
                Civic-Tech Legislative Radar • Decentralized Anti-Corruption Escrow
              </p>
            </div>
          </div>
          
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-label">Escrowed Campaign Reserves</span>
              <span className="stat-value">
                {formatGen(contractBalance)} <span className="stat-unit">GEN</span>
              </span>
            </div>
            
            {address ? (
              <div className="wallet-badge">
                <div className="blink-dot safe"></div>
                <span className="wallet-address">{truncateAddr(address)}</span>
              </div>
            ) : (
              <button onClick={connectWallet} className="btn-cyber-primary">
                Connect watch-station
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        
        {/* Left column - Setup & Presets */}
        <section className="sidebar-col">
          
          {/* Create Campaign Escrow */}
          <div className="cyber-panel">
            <div className="panel-bracket pb-tl"></div>
            <div className="panel-bracket pb-tr"></div>
            <div className="panel-bracket pb-bl"></div>
            <div className="panel-bracket pb-br"></div>
            <h2 className="panel-title">
              <Lock size={16} /> Fund Politician Campaign
            </h2>
            <form onSubmit={handleCreateCampaign} className="panel-form">
              <div className="form-group">
                <label>Politician Payout Address</label>
                <input 
                  type="text" 
                  value={politicianInput} 
                  onChange={(e) => setPoliticianInput(e.target.value)} 
                  placeholder="0x..." 
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Escrowed Collateral Amount (GEN)</label>
                <div className="input-container">
                  <input 
                    type="text" 
                    value={depositInput} 
                    onChange={(e) => setDepositInput(e.target.value)} 
                    placeholder="10.0" 
                    required
                  />
                  <span className="input-unit">GEN</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || !address} 
                className="btn-cyber-primary"
              >
                {loading ? <RotateCw size={16} className="animate-spin" /> : 'Lock Campaign Escrow'}
              </button>
            </form>
          </div>

          {/* Sandbox presets */}
          <div className="cyber-panel">
            <div className="panel-bracket pb-tl"></div>
            <div className="panel-bracket pb-tr"></div>
            <div className="panel-bracket pb-bl"></div>
            <div className="panel-bracket pb-br"></div>
            <h2 className="panel-title">
              <Scale size={16} /> Surveillance Targets (Sandbox)
            </h2>
            <p className="preset-section-desc">
              Select a legislative radar profile to verify corporate co-authorship:
            </p>
            <div className="preset-list">
              <div onClick={() => loadPreset('tax_corruption')} className="preset-card">
                <div className="preset-header">
                  <span className="preset-title">Corporate Tax Loopholes</span>
                  <span className="preset-badge scam">SLASH FUND (CORRUPT)</span>
                </div>
                <p className="preset-desc">
                  Government draft tax bill matches a corporate think-tank tax cut memo.
                </p>
              </div>

              <div onClick={() => loadPreset('energy_corruption')} className="preset-card">
                <div className="preset-header">
                  <span className="preset-title">Coal & Oil Subsidies</span>
                  <span className="preset-badge scam">SLASH FUND (CORRUPT)</span>
                </div>
                <p className="preset-desc">
                  Environmental bill sections co-authored by corporate guidelines document.
                </p>
              </div>

              <div onClick={() => loadPreset('clean_education')} className="preset-card">
                <div className="preset-header">
                  <span className="preset-title">Clean Public Education</span>
                  <span className="preset-badge safe">RELEASE (SAFE)</span>
                </div>
                <p className="preset-desc">
                  Standard public education request aligned with school advocacy memos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right column - Audit & Radar Radar Workspace */}
        <section className="workspace-col">
          
          {/* Active Campaigns registry */}
          <div className="cyber-panel">
            <div className="panel-bracket pb-tl"></div>
            <div className="panel-bracket pb-tr"></div>
            <div className="panel-bracket pb-bl"></div>
            <div className="panel-bracket pb-br"></div>
            
            <div className="registry-header">
              <h2>
                <Coins size={16} /> Politician Escrow Ledger
              </h2>
              <button 
                onClick={fetchCampaignsState} 
                disabled={loading || !contractAddress}
                className="btn-cyber-secondary"
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                <RotateCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh Radar
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="registry-empty">
                <p className="registry-empty-text">No Campaigns Registered</p>
                <p className="registry-empty-subtext">Fund a campaign escrow to begin tracking legislative plagiarism.</p>
              </div>
            ) : (
              <div className="registry-list">
                {campaigns.map((c) => (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCampaignId(c.id)}
                    className={`registry-item ${
                      Number(selectedCampaignId) === Number(c.id) ? 'active' : ''
                    }`}
                  >
                    <div className="item-header">
                      <span className="item-title">Campaign ID #{c.id}</span>
                      {getStatusBadge(c.status)}
                    </div>
                    <div className="item-details">
                      <span>Citizen: {truncateAddr(c.creator)}</span>
                      <span>Politician: {truncateAddr(c.politician)}</span>
                      <span className="item-amount">{formatGen(c.amount)} GEN</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Campaign Workspace */}
            {activeCampaign && (
              <div className={`workspace-divider ${activeCampaign.status === 'SLASHED' ? 'slashed-emergency' : ''}`}>
                
                {/* EMERGENCY HEADER BANNER */}
                {activeCampaign.status === 'SLASHED' && (
                  <div className="slashed-banner">
                    ⚠️ FUNDS SLASHED - LOBBYIST INFLUENCE CONFIRMED ⚠️
                  </div>
                )}

                {/* Details Banner */}
                <div className="workspace-banner">
                  <div>
                    <h3 className="workspace-title">Audit Station: ID #{activeCampaign.id}</h3>
                    <span className="workspace-seller">Politician Target: {activeCampaign.politician}</span>
                  </div>
                  <div className="workspace-payout-box">
                    <span className="workspace-payout-label">Escrowed Balance</span>
                    <span className="workspace-payout-value" style={{ color: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}>
                      {formatGen(activeCampaign.amount)} GEN
                    </span>
                  </div>
                </div>

                {/* Audit form trigger */}
                {(activeCampaign.status === 'ACTIVE' || activeCampaign.status === 'FAILED') && (
                  <div className="dispute-form-panel">
                    <h4 className="dispute-form-title">
                      <ShieldAlert size={14} /> Submit Legislative Audit URLs
                    </h4>
                    
                    <form onSubmit={handleAuditLegislation} className="panel-form">
                      <div className="form-group">
                        <label>Government Bill URL (Official Draft)</label>
                        <input 
                          type="url" 
                          value={billUrlInput} 
                          onChange={(e) => setBillUrlInput(e.target.value)} 
                          placeholder="https://gov.senate.bill/draft/tax-loophole-reform"
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Corporate Memo / Lobbyist Document URL</label>
                        <input 
                          type="url" 
                          value={lobbyistUrlInput} 
                          onChange={(e) => setLobbyistUrlInput(e.target.value)} 
                          placeholder="https://coalition-for-loopholes.com/internal-exemption-memo"
                          required
                        />
                      </div>

                      <div className="dispute-btn-group">
                        <button 
                          type="submit" 
                          disabled={loading}
                          className="btn-cyber-danger"
                        >
                          Scan Legislative plagiarism
                        </button>
                        
                        <button 
                          type="button"
                          onClick={() => handleReleaseCampaign(activeCampaign.id)}
                          disabled={loading || address !== activeCampaign.creator.toLowerCase()}
                          className="btn-cyber-secondary"
                          title="Release campaign funds to clean politician"
                        >
                          Release Campaign Funds
                        </button>
                      </div>
                      
                      {address !== activeCampaign.creator.toLowerCase() && (
                        <p className="dispute-warning-text">
                          <AlertTriangle size={10} /> Authorized terminal address is not the campaign citizen donor ({truncateAddr(activeCampaign.creator)})
                        </p>
                      )}
                    </form>
                  </div>
                )}

                {/* Audit loading state */}
                {activeCampaign.status === 'AUDITING' && (
                  <div className="dispute-loader-panel">
                    <div className="hex-loader"></div>
                    <div style={{ zIndex: 10 }}>
                      <h4 className="dispute-loader-title">Forensic Scanners Auditing Texts</h4>
                      <p className="dispute-loader-desc">
                        Comparing official bill draft with corporate memo. Checking for secret lobbyist co-authorship.
                      </p>
                      <div className="dispute-loader-links">
                        {activeCampaign.bill_url && (
                          <a href={activeCampaign.bill_url} target="_blank" rel="noreferrer" className="dispute-loader-link">
                            Bill Page <ExternalLink size={8} />
                          </a>
                        )}
                        {activeCampaign.lobbyist_url && (
                          <a href={activeCampaign.lobbyist_url} target="_blank" rel="noreferrer" className="dispute-loader-link">
                            Lobbyist Memo <ExternalLink size={8} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed Report Scan */}
                {(activeCampaign.status === 'SLASHED' || activeCampaign.status === 'RELEASED' || activeCampaign.status === 'FAILED') && (
                  <div className="dispute-report-wrapper">
                    
                    {/* Visual Comparison Split Screen */}
                    <div className="split-viewer">
                      
                      {/* Government bill pane */}
                      <div className="viewer-pane" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}>
                        <div className="crosshair-corner ch-tl" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        <div className="crosshair-corner ch-tr" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        <div className="crosshair-corner ch-bl" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        <div className="crosshair-corner ch-br" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        
                        {activeCampaign.status === 'SLASHED' && <div className="scanning-bar bar-scam"></div>}
                        {activeCampaign.status === 'RELEASED' && <div className="scanning-bar bar-safe"></div>}

                        <div className="pane-title">
                          <span>[ OFFICIAL GOVERNMENT BILL ]</span>
                          <Eye size={12} className="header-logo-icon" style={{ color: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }} />
                        </div>
                        <div className="viewer-pane-text">
                          <p className="viewer-pane-meta">SOURCE: {activeCampaign.bill_url}</p>
                          <p>
                            "Scanning official legislative file draft and legal sections. Auditing policy structures and specific exemption codes..."
                          </p>
                          {activeCampaign.status === 'SLASHED' && (
                            <p className="viewer-pane-alert scam">
                              🚩 SEMANTIC CO-AUTHORSHIP IDENTIFIED IN GOVERNMENT BILL.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Corporate Lobbyist memo pane */}
                      <div className="viewer-pane" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}>
                        <div className="crosshair-corner ch-tl" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        <div className="crosshair-corner ch-tr" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        <div className="crosshair-corner ch-bl" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>
                        <div className="crosshair-corner ch-br" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}></div>

                        {activeCampaign.status === 'SLASHED' && <div className="scanning-bar bar-scam"></div>}
                        {activeCampaign.status === 'RELEASED' && <div className="scanning-bar bar-safe"></div>}

                        <div className="pane-title">
                          <span>[ LOBBYIST CORPORATE MEMO ]</span>
                          <Search size={12} className="header-logo-icon" style={{ color: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }} />
                        </div>
                        <div className="viewer-pane-text">
                          <p className="viewer-pane-meta">SOURCE: {activeCampaign.lobbyist_url}</p>
                          <p>
                            "Scanning think-tank paper, corporate emails, and lobbyist draft recommendations. Matching legal loopholes..."
                          </p>
                          {activeCampaign.status === 'SLASHED' && (
                            <p className="viewer-pane-alert scam">
                              🚩 CRITICAL POLICY DRAFT COPIED FROM LOBBYIST DIRECTIVE.
                            </p>
                          )}
                        </div>

                        {/* Stamp overlay */}
                        {activeCampaign.status === 'SLASHED' && (
                          <div className="evidence-stamp stamp-scam">[ FUNDS SLASHED ]</div>
                        )}
                        {activeCampaign.status === 'RELEASED' && (
                          <div className="evidence-stamp stamp-safe">[ VERIFIED CLEAN ]</div>
                        )}
                      </div>
                    </div>

                    {/* Corruption Meter & Diagnostic report */}
                    <div className="metrics-section">
                      
                      {/* Plagiarism Corruption Meter */}
                      <div className="bullshit-meter-container" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}>
                        <div 
                          className="gauge-wrapper" 
                          style={{ '--score-val': activeCampaign.plagiarism_score }}
                        >
                          <div className="gauge-body"></div>
                          <div className={`gauge-fill ${activeCampaign.status === 'SLASHED' ? 'scam' : 'safe'}`}></div>
                          <div className="gauge-center-text">
                            <div className="gauge-number">{activeCampaign.plagiarism_score}%</div>
                            <div className="gauge-label">CORRUPTION INDEX</div>
                          </div>
                        </div>
                      </div>

                      {/* Forensic Report with REDACTED effect */}
                      <div className="report-panel" style={{ borderColor: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}>
                        <div className="report-header">
                          <span className="report-title" style={{ color: activeCampaign.status === 'SLASHED' ? 'var(--alert-red)' : '' }}>
                            <Terminal size={12} /> Forensic Plagiarism Report
                          </span>
                          <span className="report-meta">Consensus Nodes: 100% VERIFIED</span>
                        </div>
                        <div className="report-text">
                          <p style={{ color: activeCampaign.status === 'SLASHED' ? 'var(--text-light)' : '' }}>
                            {renderRedactedText(typedEvidence || activeCampaign.evidence_analysis)}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit Logs terminal */}
          <div className="terminal-panel">
            <h3 className="terminal-header">
              <Activity size={12} /> Anti-Corruption Scanner Logs
            </h3>
            <div className="terminal-body">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="terminal-time">[{log.time}]</span>
                  <span className="terminal-text">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>LobbyWatch Slasher Civic Radar • GenLayer Intelligent Contract Ledger</p>
      </footer>
    </div>
  );
}
