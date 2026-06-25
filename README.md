# LobbyWatch Slasher — Decentralized Anti-Corruption Legislative Radar

**LobbyWatch Slasher** is a civic-tech smart contract built on GenLayer that holds campaign donations for politicians in escrow. 

If a politician introduces a new bill that is secretly co-authored or heavily plagiarized from corporate lobbying group documents, the smart contract's AI radar detects it, slashes the fund, and refunds the citizens.

---

## ⚡ Why LobbyWatch Slasher DIES without GenLayer

On traditional blockchains (Ethereum, Solana, etc.), LobbyWatch Slasher **cannot exist** because:
1. **No Direct Web Access**: Traditional smart contracts cannot scrape government portals (`bill_draft_url`) or corporate documents (`lobbyist_document_url`) natively.
2. **Oracle Vulnerability**: Relying on standard centralized oracles introduces massive bribery risks; lobbyist groups could pay off the oracle operator to fake data.
3. **No Native AI Plagiarism Auditing**: Evaluating whether a legal bill was "secretly co-authored" by a lobbying whitepaper requires qualitative, natural language analysis. Traditional chains cannot run large language models on-chain.

**GenLayer solves all of this.** By using non-deterministic calls (`gl.nondet.web.render` and `gl.nondet.exec_prompt`) executed by a decentralized network of nodes, GenLayer allows the contract to:
- Directly read and scrape live government legislative texts and lobbyist reports.
- Process both documents inside a Large Language Model to act as a "Forensic Legislative Auditor".
- Reach a consensus-verified decision (`is_corrupt`) across nodes, combining web connectivity, AI reasoning, and decentralized security in a single transaction.

---

## 🛠️ Project Structure

```
LobbyWatchSlasher/
├── contracts/
│   └── lobbywatch.py       # GenLayer Intelligent Smart Contract (v0.2.16)
├── frontend/               # NSA-themed Cyber-Surveillance Dashboard (React + Vite)
└── README.md               # Documentation
```

---

## 🚀 How to Deploy on GenLayer Studio

1. **Access GenLayer Studio**: Open the GenLayer Studio developer environment.
2. **Create Contract File**: Create a new file named `lobbywatch.py` under the contracts section.
3. **Paste Code**: Copy the contents of [lobbywatch.py](contracts/lobbywatch.py) and paste it into the editor.
4. **Deploy**: Build and deploy the contract using the Studio interface. 
5. **Save Address**: Once deployed, copy the contract address (e.g., `0x...`) for the frontend configuration.

---

## 🖥️ How to Run the Frontend Dashboard

1. **Navigate to Frontend**:
   ```bash
   cd frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the `frontend` folder (or edit the existing one) and set your deployed contract address:
   ```env
   VITE_CONTRACT_ADDRESS=your_deployed_contract_address_here
   ```
4. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
5. **Open Station**: Open your browser to the local address displayed (e.g., `http://localhost:5173`) to access the Classified Legislative Radar UI.
