# TrustLens AI
`
**Continuous dark-pattern compliance testing for retail e-commerce, built on Google Cloud.**
`
AI Builder Cup | Theme: Retail & Commerce, Intelligent Customer and Business Experiences
`
TrustLens AI is a multi-agent system that tests a live storefront the way a customer would interact when purchasing anything. It finds dark patterns banned under India's CCPA 2023 guidelines, proves each one with screenshots and a cited rule, suggests a fix, and can re-test to confirm the fix worked.
`
---
`
## Submission Links
`
| Item | Link |
| --- | --- |
| Cloud Run | https://trustlens-ai-222160488915.us-central1.run.app/ |
| Video demonstration (3 to 4 min) | `<ADD VIDEO URL>` |
| Pitch deck | `<ADD DECK LINK>` |
| GitHub repository | https://github.com/rinkle-agarwal/AI-Builder-Hackathon |
| Test data | https://trustlens-ai-222160488915.us-central1.run.app/freshcart.html |
| Test data | https://trustlens-ai-222160488915.us-central1.run.app/freshcart_fixed.html |
| Sample output report (PDF) and JSON certificate | `<ADD PATH, e.g. /sample-output/>` 
`
No login or sign-up is needed anywhere in the prototype. Open the link and click on "Run analysis" in the top right corner.
`
---
`
## 1. Use Case
`
`
### The problem
`
India's Central Consumer Protection Authority (CCPA) banned 13 manipulative design practices, called dark patterns, in 2023. They include drip pricing, basket sneaking, false urgency and subscription traps. Enforcement is active: Zepto was fined ₹7 lakh and McAfee ₹1 lakh, and in June 2025 the CCPA directed all e-commerce platforms to self-audit.
`
Audits are periodic and manual. But production releases, version updates and new feature launches happen frequently, and it is difficult to check for compliance before every release.
`
## . Scope and Limits
`
- **Tested scope only.** Five of 13 patterns on one scripted journey. A 100/100 score means no violations were found in that scope. It is not a legal certification.
- **Decision support.** Verdicts carry a confidence level and are meant for human review. Penalty figures are statutory ceilings under the Consumer Protection Act 2019 (up to ₹10 lakh, ₹50 lakh for a repeat contravention), not predicted fines.
- **Demo integrations.** The Jira hand-off and the inventory feed use mock data. They are not connected to live Jira, ServiceNow or warehouse systems.
- **Tamper-evident, not court-certified.** The SHA-256 seal shows whether a record has changed since it was stored.
---
`
### Who it is for
`
Compliance and product teams at e-commerce, quick-commerce, fintech, travel and subscription businesses. It is a **pre-release tool**: run it on demand, or before every release, before a regulator or customer finds the problem. 
`
### Dark patterns tested (5 of 13)
`
| Pattern | Example caught by TrustLens |
| --- | --- |
| Drip pricing | Catalogue shows ₹756, cart shows ₹786 after an undisclosed ₹30 handling fee |
| Basket sneaking | An item or add-on appears in the cart that the customer did not add |
| False urgency | "Only 3 left!" label while the stock feed shows 178 units |
| Subscription trap | Membership is joined in one click but cancellation is hidden or multi-step |
| Confirm shaming | An optional paid extra is ticked by default at checkout |
`
`
`
`
## 2. Technical Implementation
`
### Architecture and the five Agents
`
```
Operator (React dashboard on Cloud Run)
        |
        v
Cloud Run: FastAPI backend / orchestrator
        |
        +--> 1. Navigator Agent  (Cloud Run job)
        |         screenshots + page text  --> stored in Cloud Storage
                  Plays a customer through the 10-checkpoint journey in Chromium: browse, add to cart, flash banner, checkout upsell, payment, join and cancel membership. Captures a screenshot and the page text at each checkpoint. | Cloud Run + Playwright; evidence in Cloud Storage
        |
        +--> 2. Pattern Detector  (Gemini 2.5 Flash on Agent Platform(Vertex AI), multimodal)
                  Compares paired checkpoints (for example catalogue vs cart) with a multimodal model and lists candidate anomalies. It does not conclude yet.
        |
        +--> 3. Reasoning Agent   (Gemini 2.5 Flash on Agent Platform(Vertex AI) + Input CCPA 2023 corpus.yaml in Cloud Storage)
        |         verdict + cited clauses + confidence
                  Retrieves the matching rule from the CCPA 2023 corpus yaml file, rules on each anomaly, cites the rule and gives a confidence level. Checks "Only N left" claims against an inventory source.
        |
        +--> 4. Fix Suggestion Agent   (Gemini 2.5 Flash on Agent Platform(Vertex AI))
        |         suggests fixes and alternative
                  For each finding, proposes a statutory fix with a code suggestion and an ethical business-growth alternative.
        |
        +--> 5. Verification Agent  (Cloud Storage)
                  compliance score and report
                  Scores the run, generates a report, stores it, and links later re-tests to the original finding.
```
`
### How we use Cloud Run, Cloud Storage, Artifact Registry and Gemini
`
| Technology | How TrustLens uses it |
| --- | --- |
| **Cloud Run** | Hosts the FastAPI backend and orchestration. The Playwright/Chromium Navigator runs as one Cloud Run job per run. |
| **Gemini on Agent Platform(Vertex AI)** | Gemini 2.5 Flash | Multimodal screenshot analysis (Detector), reasoning with confidence (Reasoning Agent), suggests fixes and alternative (Fix Suggestion Agent). |
| **Artifact Registry**| Storing our Docker Image in Artifact registry and pushes it to cloud run for deployment. |
| **Cloud Storage** | Screenshots, evidence files, generated PDF reports and the CCPA regulatory corpus.yaml. |
`
### Grounded, not guessed
`
Gemini is not the source of truth for what counts as a violation.
`
- The official CCPA guidance is stored as yaml file with its source and date and referred by the Reasoning Agent.
- Every finding keeps a link to the rule it relies on, and each ruling quotes the CCPA 2023 definition and legal basis.
- Claims are checked against data where possible. The false-urgency label "Only N left!" was compared with a stock feed from inventory file.
- Every verdict carries a confidence level and a status: non-compliant, needs review.
`
### Scoring and the compliance trail
`
- Each run produces a score out of 100 for the tested scope.
-Starts at 100 points and deducts penalties based on severity:
High severity (-20 pts): Drip pricing, pre-selected add-ons, hard-to-cancel traps.
Medium severity (-12 pts): False urgency timers, confirmshaming.
Score calculation: Final Score = 100 - Total Penalties (e.g., 5 violations deduct 84 pts = 16/100).
Risk standing:
80 – 100: Good Standing (Compliant)
50 – 79: Moderate Risk
Below 50: Severe Regulatory Risk
`
---
`
## 3. Repository Structure
`
`
/src                 React 18 dashboard UI & real-time telemetry (Vite SPA)
/navigator_agent     Autonomous 5-stage multi-agent pipeline (Playwright + Gemini)
/public
    /freshcart.html  Test storefront with dark patterns (All faults)
    /freshcart_fixed Remediated test storefront (Clean control)
/db                  MongoDB Atlas & Cloud Storage persistence connectors
/data                CCPA 2023 regulatory corpus & inventory feeds
server.py            FastAPI orchestrator & real-time SSE streaming server
report_generator.py  Executive audit report engine (PDF & SHA-256 certificate)
Dockerfile           Production container for Google Cloud Run
cloudbuild.yaml      Declarative Google Cloud Build CI/CD pipeline
README.md            Project documentation

`

`
## 4. Future Scope
- **Expand Dark Pattern Coverage:** Expand detection from the current 5 patterns to cover all 13 CCPA-banned practices, including interface interference, nagging, disguise ads, and trick questions.
- **Autonomous AI Testing & Custom Compliance:** Use Gemini to dynamically generate test cases and navigate unscripted journeys automatically, while allowing companies to plug in their own internal design standards alongside global regulations (EU DSA, FTC click-to-cancel).
- **Automated Issue Tracking (Jira / ServiceNow):** Automatically create Jira tickets with screenshot evidence, severity ratings, and AI-suggested code patches as soon as a dark pattern is detected.
- **Dual Role-Based Dashboards (Admin vs. Developer):**
  - **Compliance / Admin Portal:** Legal and compliance officers review audit trails, inspect dark pattern risks, and approve/assign Jira tickets.
  - **Developer Workspace:** Engineers receive assigned remediation tickets with suggested code fixes, test them locally, and mark tickets resolved before deploying builds to production.

