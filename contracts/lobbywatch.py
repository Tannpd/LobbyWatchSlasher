# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

# =============================================================================
#  lobbywatch.py — LobbyWatch Slasher Legislative Anti-Corruption Protocol
#  GenLayer Intelligent Contract (v0.2.16)
# =============================================================================

from genlayer import *
import json

class Contract(gl.Contract):
    """
    LobbyWatch Slasher
    ==================
     Civic-tech smart contract that holds campaign donations for politicians in escrow.
    Watchdogs can submit a politician's new bill URL and a corporate whitepaper URL.
    The contract uses dual web rendering and AI consensus to verify if the proposed
    legislation was secretly copy-pasted or authored by corporate lobbying groups.
    If corruption is verified, the fund is slashed and refunded to the citizens.
    """

    # Monotonic campaign counter
    campaigns_count:             u64

    # Storage Mappings (TreeMap initialized by the VM; do not reassign in __init__)
    campaign_creator:            TreeMap[u64, Address]   # Citizen donor
    campaign_politician:         TreeMap[u64, Address]   # Target politician
    campaign_balance:            TreeMap[u64, u256]      # Escrowed amount
    campaign_status:             TreeMap[u64, str]       # "ACTIVE", "SLASHED", "RELEASED", "FAILED", "AUDITING"
    campaign_bill_url:           TreeMap[u64, str]       # Official government bill draft URL
    campaign_lobbyist_url:       TreeMap[u64, str]       # Corporate lobbyist memo / whitepaper URL
    campaign_plagiarism_score:   TreeMap[u64, u256]      # 0 to 100 percentage
    campaign_evidence_analysis:  TreeMap[u64, str]       # Forensic audit intel report

    # ═══════════════════════════════════════════════════════════════════
    # CONSTRUCTOR
    # ═══════════════════════════════════════════════════════════════════
    def __init__(self) -> None:
        """
        Constructor. Standard GenLayer initialization.
        TreeMaps are pre-initialized by the VM and must not be reassigned.
        """
        self.campaigns_count = 0

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC WRITE: CREATE CAMPAIGN ESCROW
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def create_campaign(self, politician: Address) -> int:
        """
        Citizen calls this to lock native GEN campaign donations for a politician.
        """
        amount = int(gl.message.value)
        if amount <= 0:
            raise UserError("You must lock a positive GEN amount in the campaign escrow.")

        cid = self.campaigns_count

        self.campaign_creator[cid] = gl.message.sender_address
        self.campaign_politician[cid] = politician
        self.campaign_balance[cid] = amount
        self.campaign_status[cid] = "ACTIVE"
        self.campaign_bill_url[cid] = ""
        self.campaign_lobbyist_url[cid] = ""
        self.campaign_plagiarism_score[cid] = 0
        self.campaign_evidence_analysis[cid] = "Campaign escrow active. Legislation radar monitoring."

        self.campaigns_count = int(cid) + 1
        return int(cid)

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC WRITE: MANUAL RELEASE BY CITIZEN
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def release_campaign(self, campaign_id: int) -> None:
        """
        Allows the citizen creator to release the locked funds manually if the politician is clean.
        """
        if campaign_id < 0 or campaign_id >= int(self.campaigns_count):
            raise UserError("Campaign escrow does not exist.")

        status = self.campaign_status.get(campaign_id, "ACTIVE")
        if status != "ACTIVE":
            raise UserError("Campaign escrow is not in active state.")

        creator = self.campaign_creator.get(campaign_id, Address("0x0000000000000000000000000000000000000000"))
        if gl.message.sender_address != creator:
            raise UserError("Only the campaign creator can release these funds.")

        politician = self.campaign_politician.get(campaign_id, Address("0x0000000000000000000000000000000000000000"))
        amount = int(self.campaign_balance.get(campaign_id, 0))

        if amount <= 0:
            raise UserError("No funds found in the campaign escrow pool.")

        # Reentrancy protection: clear balance and change status first
        self.campaign_balance[campaign_id] = 0
        self.campaign_status[campaign_id] = "RELEASED"
        self.campaign_evidence_analysis[campaign_id] = "Funds successfully released to the politician."

        # Transfer native GEN to politician
        other = gl.get_contract_at(politician)
        other.emit_transfer(value=u256(amount))

    # ═══════════════════════════════════════════════════════════════════
    # PUBLIC WRITE: AUDIT LEGISLATION (AI FORENSIC CONSENSUS)
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.write
    def audit_legislation(self, campaign_id: int, bill_draft_url: str, lobbyist_document_url: str) -> None:
        """
        Audits the politician's bill draft against a corporate document using AI.
        If plagiarized, the campaign is slashed and refunded to the citizen creator.
        """
        if campaign_id < 0 or campaign_id >= int(self.campaigns_count):
            raise UserError("Campaign escrow does not exist.")

        status = self.campaign_status.get(campaign_id, "ACTIVE")
        if status != "ACTIVE" and status != "FAILED":
            raise UserError("Campaign escrow is not in active or failed state.")

        if len(bill_draft_url.strip()) == 0 or len(lobbyist_document_url.strip()) == 0:
            raise UserError("Bill draft URL and Lobbyist document URL cannot be empty.")

        # Record audit details
        self.campaign_bill_url[campaign_id] = bill_draft_url.strip()
        self.campaign_lobbyist_url[campaign_id] = lobbyist_document_url.strip()
        self.campaign_status[campaign_id] = "AUDITING"
        self.campaign_evidence_analysis[campaign_id] = "Executing Forensic Legislative Radar analysis..."

        # ── Non-Deterministic Execution block ───────────────────────────
        def leader_fn() -> str:
            # 1. Scrape Bill Draft (Government page)
            bill_failed = False
            try:
                bill_raw = gl.nondet.web.render(bill_draft_url)
                bill_text = bill_raw.strip()
            except Exception as e:
                bill_failed = True
                bill_text = f"ERROR: Government portal failed to load: {str(e)}"

            # 2. Scrape Lobbyist Document (Corporate Memo / Memo Report)
            lobbyist_failed = False
            try:
                lobbyist_raw = gl.nondet.web.render(lobbyist_document_url)
                lobbyist_text = lobbyist_raw.strip()
            except Exception as e:
                lobbyist_failed = True
                lobbyist_text = f"ERROR: Lobbyist memo portal failed to load: {str(e)}"

            # Edge Case: Both files unreachable
            if bill_failed and lobbyist_failed:
                return json.dumps({
                    "error": "BOTH_DOCUMENTS_FAILED",
                    "is_corrupt": False,
                    "plagiarism_score": 0,
                    "evidence_analysis": "Forensic audit could not load either the governmental bill or corporate memo URLs."
                })

            bill_excerpt = bill_text[:4000]
            lobbyist_excerpt = lobbyist_text[:4000]

            # 3. Construct Forensic Audit Prompt
            prompt = f"""You are an elite Forensic Legislative Auditor inside an anti-corruption watchdog agency.
Your task is to analyze if a proposed government bill was secretly co-authored, copy-pasted, or directly plagiarized from a corporate lobbying memo, whitepaper, or report.

Government Bill URL: {bill_draft_url}
Scraped Government Bill Content:
--- START GOVERNMENT BILL ---
{bill_excerpt}
--- END GOVERNMENT BILL ---

Lobbyist Whitepaper/Memo URL: {lobbyist_document_url}
Scraped Lobbyist Document Content:
--- START CORPORATE MEMO ---
{lobbyist_excerpt}
--- END CORPORATE MEMO ---

Please perform a strict legislative audit:
1. Compare specific paragraphs, legal formatting, structure, and complex jargon definitions.
2. Search for identical sentences, unique wording combinations, or highly specific policy demands that match corporate lobbying objectives.
3. Compute a "plagiarism_score" from 0 to 100 (100 representing copy-paste cronyism/direct plagiarism, 0 representing completely unique legislation).
4. Set "is_corrupt" to true ONLY if there is clear, severe lobbyist influence or plagiarism (plagiarism_score >= 70, or identical clauses that prove secret authorship). Minor alignment with public standard demands is NOT corruption (is_corrupt = false).

Your output MUST be a single, valid JSON object with EXACTLY the following keys:
{{
  "is_corrupt": true | false,
  "plagiarism_score": <int between 0 and 100>,
  "evidence_analysis": "<2-3 sentences summarizing the forensic evidence and plagiarized elements found>"
}}
Do NOT wrap the JSON in markdown code blocks. Do NOT output extra text. Only return the raw JSON."""

            try:
                raw_output = gl.nondet.exec_prompt(prompt)
            except Exception as e:
                return json.dumps({
                    "error": f"LLM_COMPILER_FAILED: {str(e)}",
                    "is_corrupt": False,
                    "plagiarism_score": 0,
                    "evidence_analysis": "Failed to execute forensic audit prompt."
                })

            cleaned = raw_output.strip()
            # Clean markdown code blocks if any
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                inner = []
                for line in lines[1:]:
                    if line.strip() == "```":
                        break
                    inner.append(line)
                cleaned = "\n".join(inner).strip()

            try:
                parsed = json.loads(cleaned)
                is_corrupt = bool(parsed.get("is_corrupt", False))
                score = int(parsed.get("plagiarism_score", 0))
                evidence = str(parsed.get("evidence_analysis", "No report.")).strip()

                if score < 0: score = 0
                if score > 100: score = 100

                return json.dumps({
                    "is_corrupt": is_corrupt,
                    "plagiarism_score": score,
                    "evidence_analysis": evidence[:1000]
                })
            except Exception as e:
                return json.dumps({
                    "error": f"JSON_PARSE_FAILED: {str(e)}",
                    "is_corrupt": False,
                    "plagiarism_score": 0,
                    "evidence_analysis": f"AI audit output was not valid JSON: {cleaned}"
                })

        def validator_fn(leader_result: str) -> bool:
            """
            Semantic Consensus Validator: Verifies validators agree on the core
            is_corrupt boolean decision. Ignores minor changes in textual phrasing.
            """
            try:
                leader_data = json.loads(leader_result)
            except Exception:
                return False

            if "error" in leader_data:
                allowed_errors = {"BOTH_DOCUMENTS_FAILED", "LLM_COMPILER_FAILED", "JSON_PARSE_FAILED"}
                return any(err in str(leader_data.get("error", "")) for err in allowed_errors)

            validator_raw = leader_fn()
            try:
                validator_data = json.loads(validator_raw)
            except Exception:
                return True  # Abstain (agree) if local validator fails

            if "error" in validator_data:
                return True

            leader_corrupt = bool(leader_data.get("is_corrupt", False))
            validator_corrupt = bool(validator_data.get("is_corrupt", False))

            return leader_corrupt == validator_corrupt

        # ── Execute Consensus on GenLayer VM ────────────────────────────
        consensus_json = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        try:
            res = json.loads(consensus_json)
        except Exception:
            self.campaign_status[campaign_id] = "FAILED"
            self.campaign_evidence_analysis[campaign_id] = "Consensus outcome was unparseable."
            return

        if "error" in res:
            self.campaign_status[campaign_id] = "FAILED"
            self.campaign_evidence_analysis[campaign_id] = f"Audit failed: {res.get('error')}. Detail: {res.get('evidence_analysis')}"
            return

        is_corrupt = bool(res.get("is_corrupt", False))
        score = int(res.get("plagiarism_score", 0))
        evidence = str(res.get("evidence_analysis", "Audit completed."))

        self.campaign_plagiarism_score[campaign_id] = score
        self.campaign_evidence_analysis[campaign_id] = evidence

        creator = self.campaign_creator.get(campaign_id, Address("0x0000000000000000000000000000000000000000"))
        amount = int(self.campaign_balance.get(campaign_id, 0))

        if amount <= 0:
            raise UserError("No funds found in the campaign escrow pool.")

        if is_corrupt:
            # Campaign fund slashed: refund citizens
            self.campaign_balance[campaign_id] = 0
            self.campaign_status[campaign_id] = "SLASHED"

            other = gl.get_contract_at(creator)
            other.emit_transfer(value=u256(amount))
        else:
            # Politician is clean: escrow remains active
            self.campaign_status[campaign_id] = "ACTIVE"

    # ═══════════════════════════════════════════════════════════════════
    # READ-ONLY VIEW METHODS
    # ═══════════════════════════════════════════════════════════════════
    @gl.public.view
    def get_campaign(self, campaign_id: int) -> str:
        """
        Returns a JSON-serialized representation of a campaign escrow.
        """
        if campaign_id < 0 or campaign_id >= int(self.campaigns_count):
            return "{}"

        creator = self.campaign_creator.get(campaign_id, Address("0x0000000000000000000000000000000000000000"))
        politician = self.campaign_politician.get(campaign_id, Address("0x0000000000000000000000000000000000000000"))
        balance = int(self.campaign_balance.get(campaign_id, 0))
        status = self.campaign_status.get(campaign_id, "ACTIVE")
        bill = self.campaign_bill_url.get(campaign_id, "")
        lobbyist = self.campaign_lobbyist_url.get(campaign_id, "")
        score = int(self.campaign_plagiarism_score.get(campaign_id, 0))
        evidence = self.campaign_evidence_analysis.get(campaign_id, "")

        return json.dumps({
            "id": campaign_id,
            "creator": str(creator),
            "politician": str(politician),
            "amount": balance,
            "status": status,
            "bill_url": bill,
            "lobbyist_url": lobbyist,
            "plagiarism_score": score,
            "evidence_analysis": evidence
        })

    @gl.public.view
    def get_campaigns_count(self) -> int:
        """
        Returns the total number of campaign escrows created.
        """
        return int(self.campaigns_count)
