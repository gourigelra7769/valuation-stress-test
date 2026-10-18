---
doc: spec
status: draft
---

# Valuation Stress-Test Engine — Technical Spec

## How This Works, In Plain Language

The dashboard is the control panel. A local, reviewed company-data file supplies the financial facts and their sources. A separate TypeScript calculation module checks those facts and user assumptions, projects five years of cash flow, and calculates enterprise value. In Reverse DCF mode, a numerical solver repeatedly calls that same calculation module to find the revenue growth rate that matches the fixed reference EV. The growth-versus-margin chart repeats that solve for each margin on its axis. Nothing fetches live prices, and no AI participates in the calculations.

This design keeps the difficult financial logic in plain functions that can be tested without opening the dashboard. It also keeps the one-company path small enough to build and demonstrate locally. The verified-company dashboard can only select a company whose separate data audit has passed. If no company passes, a separate `/demo` route may use deterministic fictional inputs for education; it is not a company record and cannot enter or satisfy the verified-company gate. Test-only fixtures remain isolated from user-facing results.

PRD refs: `prd.md > The Core Journey`; `prd.md > FCFF/WACC Valuation`; `prd.md > Reverse DCF Mode`; `prd.md > Growth-versus-Margin Equal-Value Chart`.

## The Core Journey Through the System

1. The app loads a local company manifest. It lists candidates and their eligibility state. Only records marked `verified` with a complete audit record appear in the company selector. Microsoft is the first audit candidate, not assumed verified. If no company passes, the dashboard explains that company data is unavailable and shows no financial placeholders.
2. The selected company dataset and its source records are parsed and validated. The dashboard shows the company/ticker, dated share-price reference, USD units, sourced facts, assumption defaults, and the derived reference EV with its bridge.
3. The assumption state and data are passed to the shared validation flow. Invalid or missing inputs produce field-level explanations and block affected outputs while independent reference/source context remains visible.
4. For Reverse DCF, the solver evaluates the fixed-target difference `modeledEV(growth) - referenceEV` over the supported growth interval. If a valid solution is found, the dashboard shows implied growth, target EV, modeled EV at the solution, and fixed assumptions. No root, invalid input, or numerical failure has its own result state.
5. Each displayed forecast margin is sent through the same reverse solver and DCF engine. The chart receives a series of valid points and explicit unavailable points. It draws separate line segments across contiguous valid points, leaving no-root gaps open.
6. Changing WACC, forecast margin, or terminal growth updates the assumption state and recomputes affected outputs. The reference EV stays fixed. Mode switches change growth-control behavior only and follow the PRD transfer rules.
7. Selecting another verified company replaces company-specific source facts and defaults, preserves the current mode, shows the defaults-loaded notice, and recalculates. It never carries the previous company’s financial data into the new company context.
8. When the verified-company list is empty, the home route keeps its existing unavailable state and may link to `/demo`. The separate demo route uses no real issuer name, ticker, market quote, source record, or source-verification claim. It persistently displays **FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA** and labels fictional inputs, user-selected assumptions, and calculated outputs separately. Its fictional baseline target is calculated with the shared DCF engine.

```text
Curated manifest + company data ──> Dataset audit/validation ──> Dashboard context
                                                                  │
User assumptions ──> Input validation ──> Shared FCFF/WACC engine ──> Forward EV
                                               ▲                  └─> Equity/share + TV share
                                               │
Fixed reference EV ──> Reverse solver ─────────┴─> Implied growth
                           │
                           └── repeated per margin ──> Equal-value chart points/gaps
```

PRD refs: `prd.md > The Core Journey`; `prd.md > Company and Reference Valuation`; `prd.md > No-Solution, Invalid, and Data-Unavailable States`.

## Stack

The learner confirmed this recommended stack. Pin actual dependency versions in the package lockfile when implementation begins; check the current framework installation requirements at that time.

- **Next.js App Router + React + TypeScript:** local responsive dashboard and UI. This matches the learner’s existing basic Next.js experience. Use a single `/` dashboard route; no API server, accounts, or database are needed. [Next.js App Router docs](https://nextjs.org/docs/app), [React documentation](https://react.dev/learn), [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/).
- **Node.js runtime:** use the current Next.js-supported LTS release, verified when bootstrapping. [Node.js releases](https://nodejs.org/en/about/previous-releases).
- **TypeScript pure modules:** data contracts, validation, EV bridge, FCFF calculation, reverse solve, and chart-point generation live outside React components. Same input values must yield the same results.
- **Local JSON files:** curated company manifest and company datasets are read at build/runtime from the repository. There is no live financial-data API or user data persistence. JSON is easy to review alongside source links and valuation dates.
- **Runtime dataset validation:** use a small explicit validator over the data contracts (no schema library required for this POC). It returns structured issues; invalid data cannot be marked selectable by the runtime gate.
- **Chart:** native SVG built from computed chart points, with responsive sizing and accessible labels/tooltips. This avoids adding a charting dependency and gives exact control over gaps between unavailable points.
- **Automated tests:** Vitest for pure calculation, validation, solver, and state-transition tests. A small React Testing Library suite can cover visible controls and states if needed after the pure engine suite. [Vitest guide](https://vitest.dev/guide/), [React Testing Library docs](https://testing-library.com/docs/react-testing-library/intro/).
- **Styling:** CSS modules or app-level CSS with CSS custom properties; no design system dependency required. Use system sans-serif typography or a locally bundled font to avoid network-dependent rendering.

The exact Node.js and dependency versions are to be checked and pinned during implementation against the current Next.js requirements. No API keys or external runtime services are required.

## Where It Runs and How Someone Tries It

- **Runtime:** browser UI served by the local Next.js development server. Requires a currently supported Node.js LTS version and npm; confirm the exact minimum in the installed Next.js release and record it in `package.json`/README.
- **Start:** `npm install`, then `npm run dev`; open `http://localhost:3000`.
- **Automated checks:** `npm test`; production compile check: `npm run build`.
- **Demo recording:** run locally, open the dashboard, and record the one-minute sequence in `prd.md > The Core Journey`. If no company audit has passed, show the honest unavailable home state and use the separate `/demo` route for the labeled fictional educational walkthrough.
- **Sharing:** a short demo video and public GitHub repository are required for submission. Deployment is optional and not part of this spec; it does not replace either deliverable.

## Look and Feel

Carry the PRD’s polished equity-research-terminal direction into a single dashboard: restrained navy/charcoal text, warm white or light-neutral surfaces, one muted accent for selected assumptions, a distinct treatment for sourced facts, and a separate calculated-output color. Keep dense information aligned in readable cards and compact tables. Use consistent USD labels and avoid red/green “trade signal” styling. Use clear numeric typography, visible dates and units, concise explanations for EV, FCFF, WACC, and terminal value, and keyboard-operable controls. The main chart gets the most visual space; unavailable regions are visibly gapped and explained. The visual system is implemented in CSS and SVG, so no external font or chart service is needed.

PRD refs: `prd.md > Screens and Layout`; `prd.md > Look and Feel`.

## Components

### Company Data Loader and Eligibility Gate

Loads `companies/index.json`, then only loads datasets whose manifest record is `verified`. It validates the dataset schema and audit evidence at runtime before making the company selectable. A status cannot be set to verified merely to make a sample appear; the audit record must identify every required source field, dates, units, classifications, and the reviewer/check result. Unknown or incomplete records remain unavailable. The first implementation path is one verified company; candidate expansion follows only after that path is complete.

PRD refs: `prd.md > Company and Reference Valuation`; `prd.md > States and Boundaries`; `prd.md > Automated Test Requirements`.

### Source and Reference Context

Presents each sourced fact with source title/publisher, direct URL, reporting or valuation date, unit, and where useful a page/table note. Shows reference share price and market-price valuation date separately from the most recent balance-sheet reporting date. Calculates and labels market-implied EV as derived, not directly quoted. It lists market capitalization and each EV adjustment in the bridge. Short-term marketable securities are deducted only if separately identified as current assets and not already included in cash/cash equivalents.

PRD refs: `prd.md > Company and Reference Valuation`; `prd.md > FCFF/WACC Valuation`.

### Assumption and Mode Controls

Owns selected company, current mode, shared operating-margin/WACC/terminal-growth assumptions, current user-entered growth, last valid reverse-solver growth, and company notice. Reverse mode displays solver growth as read-only. Forward mode permits growth edits. Company change loads that company’s defaults, preserves mode, and clears prior company-specific assumptions. Mode change preserves shared assumptions and follows the growth-transfer rules in the PRD.

PRD refs: `prd.md > Reverse DCF Mode`; `prd.md > Forward Valuation Mode`; `prd.md > Company and Reference Valuation`.

### Validation and Result-State Coordinator

Runs dataset completeness checks before company selection and assumption/model-input checks before calculation. Returns structured validation issues with a field, code, and plain-language message. Routes outputs into `valid`, `no_root`, `invalid_input`, `solver_failure`, or `data_unavailable` states. It may keep independent sourced reference information visible when model calculations are blocked. It does not turn an invalid or failed solve into a clamped number.

PRD refs: `prd.md > FCFF/WACC Valuation`; `prd.md > No-Solution, Invalid, and Data-Unavailable States`.

### Deterministic FCFF/WACC Engine

Pure TypeScript functions implement reference EV, the annual five-year projection, discounted enterprise value, terminal-value contribution, and modeled equity value per share. The engine receives normalized inputs and returns year-by-year details plus outputs. It does not read React state, fetch data, format presentation strings, or choose defaults.

PRD refs: `prd.md > FCFF/WACC Valuation`; `prd.md > Company and Reference Valuation`.

### Reverse DCF Solver

Finds growth in the inclusive supported range `[-20%, 50%]` so the shared DCF engine’s modeled EV matches a fixed reference EV. Returns a discriminated result, never a fabricated growth.

- Evaluate the residual `modeledEV(growth) - targetEV` at both endpoints and across **1,000 equal intervals** over the supported range (1,001 sampled growth values, including endpoints). Every value comes from the shared DCF engine.
- For each interval whose endpoint residuals have opposite signs, solve with deterministic bisection (maximum 100 iterations). Stop only when the bracket width is at most `0.0001` in decimal growth (0.01 percentage points) and the candidate’s independently recalculated modeled EV is within 0.01% of target EV. An exact sampled zero can be accepted after an independent recalculation; a merely near-zero sample without a sufficiently narrow bracket is not enough to claim a solution.
- Deduplicate adjacent brackets converging to the same growth. If multiple distinct roots meet tolerances, return `solver_failure` with an ambiguity explanation rather than choosing one silently.
- Return `no_root` only when all evaluations are valid, no sampled point is within tolerance, no sign-changing bracket exists, and the sampled residual sequence is strictly monotonic with a consistent nonzero direction and same-side endpoints separated from the EV tolerance. If the sequence is flat, changes direction, approaches tolerance, or otherwise leaves uncertainty, return `solver_failure`. This is the MVP’s confidence rule for the bounded scan, not a mathematical proof between samples. Tangential roots or other roots not detected by the scan may therefore produce `solver_failure`, never a fabricated or clamped solution.
- Preserve separate `invalid_input`, `solver_failure`, `no_root`, and `solved` statuses. Document the scan and bisection constants and test them directly.

PRD refs: `prd.md > Reverse DCF Mode`; `prd.md > No-Solution, Invalid, and Data-Unavailable States`.

### Equal-Value Chart Generator and SVG View

Generates operating-margin samples from 0% through 70% at 1 percentage-point intervals (71 positions). At each margin, calls the same reverse solver with the fixed target EV and all other assumptions unchanged. A point is either `{margin, growth, status: "solved"}` or `{margin, growth: null, status: "no_root" | "solver_failure" | "invalid_input", reason}`. These unavailable states remain distinguishable in tooltips/legend and are never plotted as valid points. SVG rendering splits line paths at each unavailable point; no path or interpolation crosses a gap. A marker identifies the active margin and its solved growth, or the active margin’s unavailable state. Axes show operating margin (%) and implied annual revenue growth (%); reference EV and current assumptions remain in the chart context.

PRD refs: `prd.md > Growth-versus-Margin Equal-Value Chart`; `prd.md > No-Solution, Invalid, and Data-Unavailable States`.

### Supporting Valuation Details

Shows modeled EV only for the exact identified inputs under which it was calculated. Reverse mode labels it “modeled EV at solution”; Forward mode labels the growth input and modeled EV. Shows equity value per share using the basic-share convention, with the required estimate caveat; terminal-value PV / modeled EV; and a compact source-input table. For no-root states, no modeled EV is presented as a reverse match.

PRD refs: `prd.md > Screens and Layout`; `prd.md > No-Solution, Invalid, and Data-Unavailable States`.

## Data Model

All monetary company inputs are normalized to **USD millions** internally, except share price and per-share values in USD and share counts in millions. Ratios/rates are stored as decimal numbers (for example, 5% = `0.05`) and formatted as percentages only at the interface. Fiscal years use ISO dates and explicit period labels. Every fact retains its source record; values are never represented without provenance.

### Source and historical fact records

```ts
type SourceRef = {
  id: string;
  publisher: string;
  title: string;
  url: string;
  publishedAt?: string;       // ISO date when available
  accessedAt: string;         // ISO date captured during manual audit
  locator?: string;           // filing section, table, page, or dataset field
};

type SourcedFact = {
  value: number;
  reportedValue?: number;      // original reported sign/value if normalized
  normalizationNote?: string;
  unit: "USD_millions" | "USD_per_share" | "shares_millions" | "ratio";
  period?: { start: string; end: string; kind: "FY" | "point_in_time" };
  asOf: string;               // financial reporting or market valuation date
  sourceIds: string[];
  classification?: string;    // e.g. current short-term marketable securities
  inclusionNote?: string;     // explains cash-equivalent overlap or explicit zero
};
```

### Company dataset and audit manifest

```ts
type CompanyDataset = {
  schemaVersion: 1;
  company: { id: string; legalName: string; ticker: string; exchange: string; currency: "USD" };
  marketReference: {
    valuationDate: string;
    sharePrice: SourcedFact;
    basicShares: SourcedFact;
  };
  baseYear: {
    fiscalYearEnd: string;
    revenue: SourcedFact;
    ebit: SourcedFact;
    pretaxIncome: SourcedFact;
    incomeTaxExpense: SourcedFact;
    da: SourcedFact;
    capex: SourcedFact;           // normalized positive spend magnitude; preserve reported value/sign
    operatingCurrentAssets: SourcedFact;
    operatingCurrentLiabilities: SourcedFact;
    interestExpense: SourcedFact;
    beginningInterestBearingDebt: SourcedFact;
    endingInterestBearingDebt: SourcedFact;
  };
  latestBalanceSheet: {
    reportingDate: string;
    interestBearingDebt: SourcedFact;
    cashAndCashEquivalents: SourcedFact;
    currentShortTermMarketableSecurities?: SourcedFact;
    marketableSecuritiesReview: {
      outcome: "separately_reported_current" | "not_separately_reported" | "cannot_classify";
      sourceIds: string[];
      note: string;             // evidence used to include, omit, or withhold this adjustment
    };
    preferredEquity: SourcedFact;       // explicit source-backed zero if none
    nonControllingInterest: SourcedFact; // explicit source-backed zero if none
  };
  waccEvidence: {
    riskFreeRate: SourcedFact;
    unleveredIndustryBeta: SourcedFact;
    impliedEquityRiskPremium: SourcedFact;
    betaSourceIndustry: string;
  } | null;
  defaults: {
    revenueGrowth: AssumptionDefault;
    forecastOperatingMargin?: AssumptionDefault;
    wacc: AssumptionDefault;
    terminalGrowth: AssumptionDefault;
  };
  sources: SourceRef[];
};

type AssumptionDefault = {
  value: number;
  unit: "decimal_rate";
  classification: "historical_derived" | "estimated" | "illustrative";
  rationale: string;
  method: string;
  sourceIds: string[];
  editable: true;
};

type CompanyManifestEntry = {
  companyId: string;
  datasetPath: string;
  eligibility: "candidate" | "verified" | "unavailable";
  audit?: {
    completedAt: string;
    auditor: string;
    checklistVersion: string;
    checkedFieldIds: string[];
    sourceDateConsistencyPassed: boolean;
    inputValidationPassed: boolean;
    evidenceNote: string;
  };
  unavailableReason?: string;
};
```

The runtime gate requires `eligibility: "verified"`, a complete audit record, every required sourced field, valid source IDs, and passing dataset validation. A forecast-margin default is present only when the historical baseline is within 0%-70%; if it is outside, omit that control default, preserve the independently derived historical baseline, and ask for a valid user-selected forecast margin. Do not turn the out-of-range baseline into a fabricated forecast default. An unavailable company can explain what audit evidence is missing without leaking partial values into calculations. Company-specific defaults are loaded only from that company’s dataset. Test fixtures are stored separately under `tests/fixtures/` and cannot be referenced by the manifest.

The company audit task is separate from app implementation. It must source the complete dataset and all default/WACC evidence, verify valuation dates and security classifications, record links/locators, and pass the checklist before updating a manifest record to `verified`. Until evidence exists, Microsoft, Apple, and NVIDIA remain unverified candidates and no values are supplied in this specification.

### Calculation inputs and outputs

```ts
type ModelAssumptions = {
  revenueGrowth: number;        // decimal; editable only in Forward mode
  forecastOperatingMargin: number;
  wacc: number;
  terminalGrowth: number;
};

type DcfInput = {
  baseRevenue: number;
  baseEbit: number;
  effectiveTaxRate: number;
  daToRevenue: number;
  capexToRevenue: number;
  operatingNwcToRevenue: number;
  equityBridge: {
    debt: number;
    preferredEquity: number;
    nonControllingInterest: number;
    cashAndCashEquivalents: number;
    eligibleCurrentShortTermMarketableSecurities: number;
    basicShares: number;
  };
  assumptions: ModelAssumptions;
  targetEv?: number;
};

type ForecastYear = {
  year: 1 | 2 | 3 | 4 | 5;
  revenue: number;
  ebit: number;
  taxes: number;
  da: number;
  capex: number;
  operatingNwc: number;
  changeInNwc: number;
  fcff: number;
  discountFactor: number;
  presentValueFcff: number;
};

type DcfOutput = {
  forecast: ForecastYear[];
  terminalValueAtYear5: number;
  presentValueTerminalValue: number;
  modeledEv: number;
  terminalValueContribution: number;
  estimatedEquityValuePerShare: number;
};

type SolveResult =
  | { status: "solved"; growth: number; modeledEv: number; evError: number; iterations: number }
  | { status: "no_root"; minGrowth: number; maxGrowth: number; assumptionsSummary: string }
  | { status: "invalid_input"; issues: ValidationIssue[] }
  | { status: "solver_failure"; reason: string };

type ValidationIssue = { field: string; code: string; message: string };
```

Dashboard session state lives in React memory (one reducer/context is sufficient). On page reload it deterministically reloads the company’s documented defaults and Reverse DCF mode; user scenarios are not persisted. Within the session, mode transitions preserve company and shared assumptions. Keep separate `lastValidImpliedGrowth` and `lastUserGrowth` values to implement the required transfer rules without confusing solver output and user input.

## Validation and Financial Calculation Contracts

### Dataset and source validation

- Every required input must be finite, have a supported unit, reporting/valuation date, and at least one valid source reference. All source IDs must resolve to links with publisher/title and a useful locator where available.
- Use latest complete fiscal-year income/cash-flow inputs as the base year. Balance-sheet bridge inputs use the latest available reported balance sheet on or before the market-price valuation date; show its reporting date separately.
- WACC inputs must be traceable and date-compatible: valuation-date U.S. 10-year Treasury par yield; latest U.S. unlevered industry beta available on/before that date; latest U.S. implied ERP available on/before that date; and latest complete FY interest expense / average interest-bearing debt as the historical cost-of-debt proxy. Record source, date, units, and calculation for each. Do not call the proxy a current borrowing rate. Calculate the proxy only if average beginning/ending interest-bearing debt is finite and strictly positive.
- If WACC evidence is incomplete or the historical debt proxy denominator is zero/invalid, do not divide and do not invent a cost-of-debt value. Use 9.5% only as an explicitly illustrative editable fallback. Never set or label it as a company-specific calculated estimate. If no valid WACC can be established under the fallback policy or the selected value fails supported-range rules, block affected calculations with a clear explanation.
- Company audit checks the non-financial eligibility criterion, complete sourced fields, dates, units, consistent reporting periods, cash/security classification and no overlap, tax eligibility, and all model input requirements. Missing or inconsistent required values make that company unavailable; no synthetic company value can satisfy the gate.

### Reference EV and equity bridge

At the market-price valuation date, using basic shares:

`marketCap = sharePrice × basicShares`

`referenceEV = marketCap + interestBearingDebt + preferredEquity + nonControllingInterest - cashAndCashEquivalents - separatelyReportedCurrentShortTermMarketableSecurities`

The short-term securities subtraction is included only if their current-asset classification and amount are source-supported and they are not already included in cash equivalents. The audit record must also document whether the source reports no separate current short-term securities or does not permit classification; omission is never silently interpreted as zero. Keep source dates distinct. Use the same adjustment convention for modeled equity per share:

`estimatedEquityValuePerShare = (modeledEV - debt - preferredEquity - nonControllingInterest + cashAndCashEquivalents + eligibleCurrentShortTermMarketableSecurities) / basicShares`

Use the documented simplified basic-share convention. Label the result an estimate that may differ from diluted-share or other market-data conventions. Include long-term investments and lease liabilities in neither bridge. Do not double-count cash or marketable securities.

### Five-year FCFF projection

Base year is latest complete FY. Store all ratios from that same FY. Normalize reported CapEx outflows into a positive spend magnitude before projection; retain the reported sign/value and normalization note for auditability. D&A and CapEx must be nonnegative engine inputs. For forecast year `t` (1 through 5), with `g` as the constant annual growth and `m` as the forecast operating margin:

```text
Revenue[t] = BaseRevenue × (1 + g)^t
EBIT[t] = Revenue[t] × m
Taxes[t] = EBIT[t] × historicalEffectiveTaxRate
D&A[t] = Revenue[t] × (baseYearD&A / baseYearRevenue)
CapEx[t] = Revenue[t] × (baseYearCapEx / baseYearRevenue)
OperatingNWC[t] = Revenue[t] × (baseYearOperatingNWC / baseYearRevenue)
ChangeInNWC[t] = OperatingNWC[t] - OperatingNWC[t-1]
FCFF[t] = EBIT[t] - Taxes[t] + D&A[t] - CapEx[t] - ChangeInNWC[t]
PV(FCFF[t]) = FCFF[t] / (1 + WACC)^t
TV[5] = FCFF[5] × (1 + terminalGrowth) / (WACC - terminalGrowth)
PV(TV) = TV[5] / (1 + WACC)^5
ModeledEV = sum(PV(FCFF[1..5])) + PV(TV)
TerminalValueContribution = PV(TV) / ModeledEV
```

For year 0, `OperatingNWC[0]` is the source-derived base-year operating NWC. Operating NWC is operating current assets less operating current liabilities, excluding cash and interest-bearing debt; it may be negative. Taxes use the fixed historical effective tax rate and do not model loss carryforwards or changing tax rates. Tax rate is reported tax expense / reported pre-tax income and is valid only if pre-tax income is positive and the result is 0%-40%, inclusive. Initial eligible companies require positive base EBIT. The simplified tax limitation is disclosed in the dashboard.

### WACC and defaults

Calculate beta and CAPM only with eligible sourced inputs:

```text
E = sharePrice × basicShares
D = reported interest-bearing debt
leveredBeta = unleveredIndustryBeta × [1 + (1 - historicalTaxRate) × D / E]
costOfEquity = riskFreeRate + leveredBeta × impliedEquityRiskPremium
historicalCostOfDebtProxy = latestCompleteFYInterestExpense / average(beginningDebt, endingDebt)
WACC = E/(D+E) × costOfEquity + D/(D+E) × historicalCostOfDebtProxy × (1 - historicalTaxRate)
```

Use market equity and reported debt weights. Never divide by average debt unless it is finite and strictly positive. If average beginning/ending interest-bearing debt is zero, negative, missing, inconsistent, or otherwise invalid, do not calculate or substitute a cost-of-debt proxy. Show why the historical proxy is unavailable, then use the approved 9.5% fallback only as an explicitly illustrative, editable value. This fallback is not the missing proxy and must never be labeled company-specific. If the 9.5% fallback or another user-selected WACC is outside the supported 5%-20% range, or if the fallback cannot establish a valid WACC after range/terminal-growth validation, block affected calculations and show the exact reason; do not silently use another value.

Defaults and controls: revenue growth 5% illustrative/editable, solver range -20% to 50%; forecast margin 0%-70%, company-specific documented baseline from historical EBIT/revenue when it lies in range; WACC supported range 5%-20%; terminal growth 2% illustrative/editable, range 0%-4%, with dynamic upper bound `min(4%, WACC - 0.5 percentage points)`. Rates are decimal internally. If a traceable CAPM-derived WACC falls outside its supported range, preserve and label the calculation/evidence but block affected calculations until the user chooses an in-range WACC; do not clamp it or replace it with the illustrative fallback. The 5% growth default and all supported ranges are modeling boundaries/assumptions, not claims of actual market expectations.

Historical EBIT/revenue remains visible with source/date even outside the forecast-control range. Company eligibility is unaffected if all other data checks pass. In that case show an out-of-range notice and block affected calculations until the user selects a 0%-70% forecast margin. Never clip or silently substitute the historical figure. Terminal growth must be strictly below WACC and at least 0.5 percentage points below it.

## Reverse Solver and Chart Contracts

### Reverse solver

Function shape: `solveGrowthForTarget(inputWithoutGrowth, targetEV, supportedRange) -> SolveResult`. Every evaluation calls the same pure `calculateDcf` function. Reference EV is immutable for the active company snapshot and never recalculated from assumptions. Use the deterministic 1,000-interval scan and bisection contract in `Reverse Solver and Chart Contracts`. The main Reverse DCF mode and chart call the same solver function. Tangential or otherwise undetected roots may produce `solver_failure`; never convert uncertainty into a false `no_root` or a clamped growth value.

### Equal-value chart

Generate 71 margin values from 0.00 to 0.70 by 0.01. At each, create an otherwise identical input and solve against one fixed target EV. Keep the chart independent of display rounding. Render each contiguous run of solved points as a separate SVG path; null/unavailable points terminate a path. Never connect or interpolate across unavailable values. Show margin x-axis in percent, implied annual growth y-axis in percent, target EV, current assumption marker, and a reason/key for unavailable regions. Every solved point must recalculate to target EV within 0.1%. If the historical baseline is outside the forecast range and no valid active margin has been chosen, the chart may still show valid per-margin solutions when all other inputs are valid; omit the active assumption marker and keep the main Reverse/Forward calculation blocked until a valid margin is selected.

## Validation Flow and User-Visible States

1. **Manifest gate:** candidate must have completed audit evidence and pass schema/source/dates checks. Otherwise it is unavailable and cannot be selected.
2. **Company input validation:** validate financial facts, units/periods, tax rate, share count, bridge inputs, WACC evidence/fallback classification, defaults, and current-vs-long-term security classification. Invalid company dataset blocks selection or displays an explanatory unavailable state.
3. **Assumption validation:** check finite values and supported ranges. Growth controls/search remain within -20% to 50%; forecast margin 0%-70%; WACC 5%-20%; terminal growth 0%-4% and no more than WACC minus 0.5 percentage points. Nonpositive share count, negative base revenue, negative normalized D&A/CapEx, non-finite or unsupported values, missing required source data, and WACC <= terminal growth are rejected. Normalize reported CapEx signs before this rule. Negative operating NWC is accepted when derived from attributed balances. Average debt <=0 never reaches a cost-of-debt division and triggers the documented illustrative WACC fallback; if no valid fallback/selected WACC is available, block affected calculations. A verified but out-of-range historical or CAPM-derived value remains visible and attributed; the user must explicitly select a valid control value before affected calculations run.
4. **Calculation:** only valid normalized inputs reach the calculation engine. Each output identifies mode and exact input assumptions. Reverse modeled EV is called “at solution” only for a successful solve.
5. **Failure presentation:** no-root preserves source/reference context and shows supported range/active assumptions; solver failure and invalid inputs explain their cause; Forward mode remains available when its inputs are valid. Missing data never becomes placeholder outputs.

Company change loads the new company’s defaults and data, retains mode, displays “Loaded default assumptions for [company],” and clears prior company assumptions. Mode switches preserve company/shared assumptions; Reverse→Forward growth uses last valid solver growth, else last user-entered growth, else company default. Forward→Reverse preserves that user growth as context but solves afresh. No mode switch occurs from editing a growth control.

PRD refs: `prd.md > FCFF/WACC Valuation`; `prd.md > Reverse DCF Mode`; `prd.md > Forward Valuation Mode`; `prd.md > No-Solution, Invalid, and Data-Unavailable States`; `prd.md > States and Boundaries`.

## Work Boundaries and Order

Company data audit and software implementation are separate tasks. The audit records sourced values and determines whether a company may be selected; implementation consumes only an audit-passed dataset. Do not set a company to `verified` as part of writing UI or tests, and do not place financial figures in this spec. A synthetic fixture is permitted only for isolated automated tests. The Microsoft audit may proceed as a separate workstream, but the dashboard must wait for its complete evidence before loading it.

Strict implementation order:

1. Define typed domain contracts and validation; test required and invalid data/assumption cases.
2. Implement the reference EV and equity-value bridge; test the formulas, source-date handling, securities classification, and double-count prevention.
3. Implement the FCFF/WACC DCF engine and independent fixed fixture tests; verify yearly projections, EV, terminal value, and per-share bridge.
4. Implement the 1,000-interval reverse solver and its tests (known roots, boundaries, no-root confidence, invalid input, and solver failure).
5. Implement equal-value chart-point generation and tests for target matching, unavailable results, and visible gaps.
6. Integrate the dashboard with a fully audited company dataset and complete the one-company path end to end: context, modes, controls, outputs, sources, and edge states.
7. Only after the one-company acceptance milestone passes, audit Apple and NVIDIA independently and add only datasets that pass. Their audits, additional-company work, and extra visual polish must not delay the one-company milestone. Keep the tornado chart secondary.

The one-company model/solver/chart with an audited dataset is the primary acceptance milestone.

## Automated Testing Strategy

Automated tests are part of the implementation acceptance bar. Build them in the implementation order below; synthetic fixtures are labeled test-only and cannot reach the UI.

1. **Typed validation:** reject WACC <= terminal growth, nonpositive shares, negative revenue, negative D&A/CapEx, nonfinite values, unsupported rates/ratios, missing source IDs/dates/units, date mismatches, invalid tax rates, and unclassified/overlapping marketable securities. Cover average debt zero/negative/missing/invalid: assert no division occurs, the fallback is visibly illustrative if used, and affected calculations block with a clear explanation if WACC remains invalid. Accept negative operating NWC when sourced. Historical margin outside 0%-70% keeps company eligible but blocks affected calculation until user chooses valid margin.
2. **Reference EV/equity bridge:** verify share-price × basic-share market cap, every bridge adjustment, eligible current short-term securities inclusion, double-count avoidance, source-date display inputs, and basic-share per-share convention.
3. **Pure DCF fixture:** independently hand-calculated fixture for all five years: revenue, EBIT, taxes, D&A, CapEx, NWC change, FCFF, discount factors/PVs, terminal value, modeled EV, equity bridge, per-share estimate, and terminal-value contribution. Require agreement within 0.01% or display-rounding tolerance for per-share. Repeated identical inputs must produce identical outputs.
4. **Reverse solver:** known-root recovery within 0.01 percentage points and EV error <=0.01%; endpoint roots; valid no-root targets; invalid-input and solver-failure differentiation; deterministic repeated execution; supported-boundary enforcement; and an adversarial tangential/narrow-root case that must not be mislabeled `no_root`.
5. **Chart:** each valid chart point goes through the same DCF/solver and matches target EV within 0.1%. Tests cover 71 expected margin positions, unavailable points, path segmentation/gaps, active-point marker, and no interpolation across gaps. With an out-of-range historical baseline and no selected forecast margin, verify valid curve points can remain visible while the current marker and affected main calculation stay unavailable.
6. **Mode/company transitions:** shared assumptions and selected company survive mode changes; mode stays explicit; solver growth is read-only in Reverse; Forward growth is editable; transfer priority (last valid implied → last user value → company default) works; switching back recalculates; company selection loads its defaults, preserves mode, clears prior company inputs, and produces notice.
7. **Company eligibility:** Microsoft, Apple, and NVIDIA remain unavailable in test data until evidence-backed audit records pass. Verify no incomplete data set appears in the selector and one verified company works without requiring other companies.
8. **UI states:** test initial valid/default and unavailable states, valid reverse solution, no-root, invalid assumptions, solver failure, out-of-range historical-margin notice, forward valuation, source links/date labels, reference EV bridge, and responsive chart labels.
9. **Educational demo isolation:** verify the fictional scenario is not a `CompanyDataset`, never appears in the production manifest or verified-company selector, and cannot satisfy the runtime eligibility gate. Verify the demo target and forward/reverse/chart outputs call the existing DCF, solver, and chart-series modules; verify the exact persistent warning and separate labels for fictional inputs, user assumptions, and calculated outputs. The home unavailable state remains present when the verified list is empty.

Numerical tolerances and behavior are carried directly from `prd.md`; changing them requires PRD revision and approval before implementation.

## File Structure

```text
valuation-stress-test/
├── app/
│   ├── layout.tsx                  # Page shell, global styles, metadata
│   ├── page.tsx                    # Dashboard route and initial data gate
│   ├── demo/page.tsx                # Separate fictional educational route
│   └── globals.css                 # Responsive terminal-style layout/tokens
├── components/
│   ├── CompanyContext.tsx          # Selector, ticker, dates, source/reference EV
│   ├── ValuationSummary.tsx        # Reverse/forward key result states
│   ├── AssumptionsPanel.tsx        # Mode-aware controls and validation messages
│   ├── EqualValueChart.tsx         # SVG curve, markers, unavailable gaps/tooltips
│   ├── ValuationDetails.tsx        # Modeled outputs, TV share, source-input table
│   └── DataUnavailable.tsx         # No verified dataset / invalid dataset state
├── data/
│   └── companies/
│       ├── index.json              # Candidate/verified manifest and audit record
│       └── README.md               # Data audit entry requirements, no values
├── src/
│   ├── domain/
│   │   ├── types.ts                # Facts, assumptions, inputs, outputs, statuses
│   │   ├── validate.ts             # Dataset/model assumption validation
│   │   ├── reference-ev.ts         # Market EV and equity bridge calculations
│   │   ├── dcf.ts                  # Five-year FCFF and WACC calculation
│   │   ├── solver.ts               # Deterministic reverse growth solver
│   │   ├── chart-series.ts         # Margin samples solved against fixed target
│   │   └── company-data.ts         # Manifest loader and eligibility gate
│   └── state/
│       └── dashboard-reducer.ts    # Mode/company/assumption transition rules
├── tests/
│   ├── fixtures/
│   │   └── dcf-fixture.ts          # Synthetic test-only financial inputs
│   ├── domain/
│   │   ├── dcf.test.ts
│   │   ├── solver.test.ts
│   │   ├── chart-series.test.ts
│   │   ├── validate.test.ts
│   │   ├── reference-ev.test.ts
│   │   └── company-data.test.ts
│   └── state/
│       └── dashboard-reducer.test.ts
├── devpost/                        # Approved scope, PRD, spec and learner profile
├── package.json                    # Scripts/dependency versions
├── package-lock.json               # Reproducible installation
├── tsconfig.json
└── README.md                        # Setup, data audit policy, run and test commands
```

## External Services and Dependencies

There are no runtime external services, API endpoints, keys, databases, or recurring costs. Historical inputs are manually reviewed and stored locally with attribution. User interaction and calculations run locally. Documentation for major dependencies is linked under `Stack`. The data sources used for each company are recorded inside that company’s dataset; sources are not selected or represented as verified by this specification.

## Important Failure Modes

- **No company dataset passes audit** → keep the main route in its clear unavailable state with no financial placeholders. The separate `/demo` route may show a deterministic fictional educational scenario with the persistent exact warning **FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA**. It has no real issuer, ticker, quote, source-verification claim, or manifest record; it distinguishes fictional inputs, user assumptions, and calculated outputs and reuses the approved DCF, solver, and chart functions. It cannot pass the company eligibility gate.
- **Dataset missing a value, source, date, unit, classification, or date-consistent WACC evidence** → keep it out of the selector; explain the audit failure. Never fill from a second company or silently substitute an assumption for a sourced fact.
- **Reverse solver has no valid solution or cannot classify the numeric result** → preserve reference/source information, show no-root only when absence is established, otherwise show numerical solver failure; leave chart gaps.
- **User assumption is invalid** → retain independent reference context and identify the field/range; block affected outputs until corrected.

## What Was Simplified and Why

- **One local dashboard and curated JSON datasets** instead of accounts, a database, or a live quote feed — one-person reproducibility and source review are central to the MVP; remote data adds credentials, freshness issues, and failure modes without proving the model.
- **Pure deterministic model functions** instead of an AI valuation layer — the PRD requires calculations to be testable and never delegated to AI.
- **Native SVG equal-value chart** instead of a full charting suite — it is the one required central visual and needs exact unavailable gaps; the simpler implementation keeps those semantics explicit.
- **One fully verified company first** instead of assuming three complete datasets — additional companies are added only after the complete one-company flow works and each dataset audit passes.
- **No persistence between visits** instead of saved scenarios/accounts — the PRD needs one transparent interactive session, not account infrastructure.

## Decisions and Open Issues

### Decisions

- **Learner-approved:** Next.js + TypeScript with local curated company data, per the learner’s accepted recommendation. Tradeoff: the learner will work within the familiar React/Next.js shape and the app remains local-first; no live refresh or multi-user persistence.
- **Product decisions carried forward:** all financial conventions, source attribution, ranges, no-solution behavior, and acceptance thresholds in the approved `prd.md` remain authoritative. This spec does not redefine them.
- **Implementation-derived:** separate calculation modules, runtime dataset gate, static local data, and deterministic SVG chart are selected to meet those product rules with few dependencies.
- **Company data audit is separate:** candidates cannot be marked verified or shown as supported until evidence-backed source completeness and validation checks pass. The spec contains no company financial values.

### Open issues and checks

- **Company-specific audit work:** verify Microsoft first, then audit Apple/NVIDIA only if time permits; record source values, source locators, dates, units, classifications, model assumptions, and date-compatible WACC evidence. This is a prerequisite for eligibility and remains separate from software implementation.
- **Version check at build start:** install the currently supported Next.js/React/Node versions and pin them in the lockfile; verify package compatibility then. This is routine dependency verification, not a product decision.
- **Numerical solver boundary:** the 1,000-interval scan can miss a tangential or narrow root. It must return `solver_failure` when sampled evidence cannot confidently establish a root or no-root; test this behavior and never turn an uncertain scan into `no_root`.
- **Learner learning point:** the solver and the chart are not separate models: each chart point must call the exact same DCF and root-solving code as Reverse DCF. The test that recomputes each point’s EV is the check that this stays true.

PRD refs: `prd.md > Remaining Review Items`; `scope.md > The POC Boundary`.
