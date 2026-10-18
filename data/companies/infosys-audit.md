# Infosys Limited (NSE: INFY) source audit — not eligible

Research captured **2026-10-18**. This is an evidence audit only. No production dataset was created and Infosys has not been marked verified.

## Scope, periods, currency, and source basis

- Entity: Infosys Limited and subsidiaries (consolidated), primary Indian listing **NSE: INFY**.
- FY2025 period: year ended **2025-03-31**. Latest balance sheet considered: **2025-03-31**.
- Proposed historical valuation date for an eventual snapshot: **2025-07-02**. The audited Form 20-F was filed July 1, 2025; the next quarter-end statement was not approved until July 23, 2025. This proposed date keeps the market reference after FY2025 evidence became public and before the next quarterly balance sheet. It is not finalized because an exact NSE close for that date has not been verified.
- The financial statement inputs below are reported in **USD millions**, rounded to the nearest million, in Infosys’s official IFRS USD financial statements. Shares are actual shares unless normalized below. These USD values are directly reported by Infosys; no independent INR/USD translation is applied.

### Official sources consulted

1. [Infosys Integrated Annual Report 2024–25 (INR consolidated statements)](https://www.infosys.com/investors/reports-filings/annual-report/annual/documents/infosys-ar-25.pdf), audited consolidated Ind AS statements and notes, printed pp. 303–345. Amounts there are ₹ crore. Used to cross-check the USD statement and inspect detailed classifications.
2. [Infosys FY2025 Q4 IFRS USD earnings release and audited interim condensed consolidated statements](https://www.infosys.com/investors/reports-filings/quarterly-results/2024-2025/q4/documents/ifrs-usd-earnings-release.pdf), statements and notes approved April 17, 2025. Amounts are USD millions except share counts and per-share amounts. Relevant statement pages: balance sheet p. 1, comprehensive income p. 2, cash flows p. 5; notes 2.1–2.6, 2.8, 2.12–2.13, 2.17–2.19.
3. [Infosys FY2025 Form 20-F (official Infosys-hosted copy)](https://www.infosys.com/investors/reports-filings/annual-report/form20f/documents/form20f-2025.pdf) and [SEC filing](https://www.sec.gov/Archives/edgar/data/1067491/000095017025091925/infy-20250331.htm), filed July 1, 2025. Audited consolidated IFRS statements for years ended March 31, 2025, 2024, and 2023, in USD millions rounded to the nearest million. Used to corroborate the FY2025 values and the “no outstanding borrowings” disclosure.
4. [Official Infosys Q4 Ind AS results page](https://www.infosys.com/investors/reports-filings/quarterly-results/2024-2025/q4/ind-as.html), including the audited consolidated statements and auditor’s report, approved April 17, 2025.

The USD statements are official reported statements, not synthetic inputs. The INR statements are used where their notes provide greater breakdown detail. Do not combine rounded USD and INR values in one calculation without a documented conversion/precision convention.

## Required fact inventory

| Required fact | Reported value / method | Period or date; unit | Evidence and status |
|---|---|---|---|
| Revenue | **19,277**; statement caption “Revenues” | FY ended 2025-03-31; USD millions | FY2025 IFRS USD earnings release, condensed consolidated statement of comprehensive income p. 2; supported. |
| EBIT | **4,071**; reported “Operating profit,” used as EBIT per spec | FY ended 2025-03-31; USD millions | Same statement p. 2; also function-wise operating-profit reconciliation in annual report Note 2.27, printed p. 345; supported. |
| Pretax income | **4,447**; reported “Profit before income taxes” | FY ended 2025-03-31; USD millions | Same statement p. 2; supported. |
| Income-tax expense | **1,285**; reported total income-tax expense. The current/deferred components reconcile to this total in Note 2.12. | FY ended 2025-03-31; USD millions | IFRS USD earnings release, statement p. 2 and Note 2.12; supported. Derived historical tax rate for audit context: 1,285 / 4,447 = **28.90%**. This is a calculation, not a separately reported rate. |
| Pure D&A | **569**; cash-flow statement explicitly captions “Depreciation and amortization.” No “and other” is included in that line. | FY ended 2025-03-31; USD millions | IFRS USD earnings release, consolidated cash-flow statement p. 5; annual report segment table separately reports D&A 4,812 ₹ crore and “non-cash expenses other than D&A” as nil (printed p. 344). Supported at the USD statement’s nearest-million precision. |
| Capital expenditure | Cash-flow outflow **(263)** on “Expenditure on property, plant and equipment and intangibles”; normalized model magnitude would be **263** while provenance retains the negative cash-flow sign. | FY ended 2025-03-31; USD millions | IFRS USD earnings release, cash-flow statement p. 5; supported. The broader PPE-and-intangibles cash-flow line is used, not a separately described tangible-only management statistic. |
| Finance cost / interest expense | Reported finance cost **49**. The annual report’s management discussion states finance cost is on account of leases (printed p. 73); leases are excluded from the approved debt bridge. The Group also states it had **no outstanding borrowings** at both March 31, 2025 and March 31, 2024. Therefore no in-scope borrowing interest expense is reported; a derived `interestExpense = 0` would be based on those explicit disclosures, while 49 must not be mislabeled as debt interest. | FY ended 2025-03-31; USD millions | IFRS USD cash-flow statement p. 5; Annual Report liquidity discussion printed p. 306 / Form 20-F “Liquidity and capital resources.” The calculation’s zero should be labeled derived, not reported. Average debt is zero, so the historical cost-of-debt ratio must not be calculated. |
| Beginning interest-bearing debt | **0**; no outstanding borrowings at March 31, 2024 | Point-in-time 2024-03-31; USD millions | Form 20-F liquidity disclosure explicitly covers 2024 and 2025; supported. Exclude lease liabilities under the spec. |
| Ending interest-bearing debt | **0**; no outstanding borrowings at March 31, 2025 | Point-in-time 2025-03-31; USD millions | Form 20-F liquidity disclosure and annual report consolidated liquidity discussion; supported. Current/noncurrent lease liabilities of 287 / 675 are separately reported and excluded per spec. |
| Cash and cash equivalents | **2,861**; includes **50** restricted cash, already within that cash total | Point-in-time 2025-03-31; USD millions | IFRS USD balance sheet p. 1 and Note 2.1 p. 8; supported. Count cash once. |
| Current short-term marketable securities | **1,460** current investments. Note 2.2 lists current quoted debt securities, certificates of deposit, commercial paper, and liquid mutual fund units. | Point-in-time 2025-03-31; USD millions | IFRS USD earnings release balance sheet p. 1 and Note 2.2 p. 8; supported as separately reported current investments. Balance-sheet cash is separately captioned; Note 2.1 reconciles cash only to cash/bank deposits, so no overlap is indicated. Include current investments once; exclude noncurrent investments. |
| Preferred equity | **0** for Infosys Limited share capital: Note 2.18 says the Company has one class of equity shares and “no such preferential amounts exist currently.” | Point-in-time 2025-03-31; USD millions | IFRS USD earnings release Note 2.18 p. 30 and annual report Note 2.12.1, printed p. 229; supported explicit zero for the issuer’s equity bridge. The group balance sheet separately presents non-controlling interest. |
| Non-controlling interest | **50** | Point-in-time 2025-03-31; USD millions | IFRS USD balance sheet p. 1 and statement of changes in equity p. 4; supported. Do not use zero. |
| Basic shares | **4,143,607,528** issued and outstanding, net of 9,655,927 treasury shares as of March 31, 2025; normalized to **4,143.607528 million shares**. FY basic weighted-average shares are 4,141,611,738, but that is a different measure and is not used as the point-in-time market-cap share count. | Point-in-time 2025-03-31; actual shares / normalized millions | IFRS USD earnings release balance sheet p. 1 share-capital caption and Note 2.13 p. 24; supported as a dated point-in-time count, subject to rechecking any later share changes before chosen valuation date. |
| NSE share price | No exact close recorded. Proposed reference date is 2025-07-02; a date-matched official NSE security-level closing row was not retrieved in this pass. A price on another date or a secondary quote is not silently substituted. | Required 2025-07-02; INR/share, then USD/share per schema | **Unresolved required fact.** Need exact NSE close and a documented INR-to-USD normalization method for the `USD_per_share` schema unit, or a specification-approved local-currency treatment. |

## Enterprise-value bridge and security review

At the proposed snapshot, the sourced balance-sheet components are all dated **2025-03-31**, before the proposed valuation date:

- Market capitalization method: date-matched share close × 4,143.607528 million shares. The share close and local-currency-to-USD treatment remain unresolved, so market capitalization and reference EV are not calculated.
- Interest-bearing debt: 0. Lease liabilities (current 287 and noncurrent 675 USD millions) are not added, as explicitly required by the spec.
- Cash and cash equivalents: 2,861 USD millions, including 50 restricted cash; subtract once.
- Current investments: 1,460 USD millions, separately reported and composed of current debt securities, CDs, commercial paper, and money-market mutual fund units; subtract once as separately classified current investments. Do not include noncurrent investments or count any cash equivalents twice.
- Preferred equity: 0, supported by the issuer’s explicit “no preferential amounts” disclosure.
- NCI: 50 USD millions; add to the equity-to-enterprise bridge.

The gate’s `marketableSecuritiesReview` can honestly be `separately_reported_current` with the cited Note 2.2 and Note 2.1: current investments have their own balance-sheet line and cash equivalents are separately reconciled to cash/bank deposits.

## Operating working-capital classification (FY2025 end)

Base-year operating current assets/liabilities must describe **2025-03-31**, not a later balance sheet. The USD report’s condensed balance sheet and Notes 2.4–2.6 provide a mostly detailed but not wholly classifiable breakdown. Proposed policy is to include customer/supplier and service-operation balances, and to exclude cash, current investments, income-tax assets/liabilities, derivatives, employee loans, interest accruals, lease financing balances, and capex/acquisition/equity financing liabilities.

### Assets

Clearly operating or operating-linked reported components (USD millions): trade receivables **3,645**; current unbilled revenue **1,503**; and from Note 2.4, security deposits **8**, prepaid expenses **360**, vendor advances **48**, deposits with corporations for employee-related obligations **345**, deferred contract acquisition cost **40**, and contract fulfillment cost **59**. These clearly classified components sum to a **partial operating current-asset subtotal of 6,008**.

Exclude cash **2,861**, current investments **1,460**, income-tax assets **348**, derivative assets **23**, employee loans **29**, accrued interest **99**, and net investment in leases **133**. These are separately identified as cash/investments, tax, derivative/financial, lending, interest, or lease balances; they are not operating working capital under the stated convention.

Unresolved asset classification: Note 2.4’s “Other financial assets” **55** has no further composition in the reviewed filing. “Withholding taxes and others” **332** is described as primarily input tax credits and VAT recoverable, but “and others” is not fully broken out. The **other non-financial assets 11** caption is also not described more specifically. The source’s USD Note 2.4 categories sum exactly to the 1,519 current prepayments/other-assets line, but these unresolved captions prevent a fully attributed operating asset total. Do not include the 55 as operating or assert that every dollar of the 332 or 11 is operating without further support.

### Liabilities

Clearly operating reported components (USD millions): trade payables **487**; unearned revenue **994**; employee benefit obligations **340**; post-sales client-support provisions **155**; and from Note 2.5, accrued compensation **576**, accrued expenses **991**, accrued defined-benefit liability **1**, and controlled-trust liabilities **20**. These sum to a **partial operating current-liability subtotal of 3,564**. Note 2.5 says accrued expenses principally relate to subcontractors, telecoms, legal/professional services, marketing, travel, office maintenance, and third-party software/hardware. Note 2.6 separately reports an **18** provision for a cybersecurity-incident settlement; that is excluded as non-routine and non-operating.

Exclude current lease liabilities **287**, derivative liabilities **7**, income-tax liabilities **567**, contingent consideration **1**, capital creditors **61**, financial option liabilities **64**, and the disclosed technology-asset financing liability (**8**, included within another financial-liability caption). These are lease/debt-like, derivative, tax, acquisition, capex, equity-option, or explicit financing items.

Unresolved liability classification: Note 2.5’s “Other financial liabilities” **61** is not fully described, and “Withholding taxes and others” **381** plus “Other non-financial liabilities” **1** include residual “others” without a complete operating/non-operating split. The source states the 61 includes an 8 financing arrangement but does not resolve the remaining balance’s nature. Note 2.6’s **155** “post-sales client support and others” provision is described as majorly representing support costs, not wholly; it also remains partly unresolved. Do not classify the entire financial line or these mixed captions as operating by default.

The difference between the clearly classified subtotals is **6,008 − 3,564 = 2,444 USD millions**, but this is only a **partial NWC subtotal**, not the required complete operating NWC. Unresolved 55 asset and 61 liability balances, plus the mixed 332 / 381 captions and other small residuals, prevent an exact attributed total. No production NWC amount should be set from this subtotal.

## Defaults and WACC rule

- Historical EBIT margin calculation: 4,071 / 19,277 = **21.12%**. It is within the spec’s 0%–70% range and can serve as a **historical-derived, editable** forecast-margin default if the company otherwise becomes eligible.
- Revenue-growth default **5%** and terminal-growth default **2%** are **illustrative and editable** per the spec; they are not historical company facts.
- A cost-of-debt proxy must not be computed: beginning and ending interest-bearing debt are both zero, so average debt is zero. The reported 49 finance cost is lease-related and is not a borrowing rate.
- The approved **9.5% WACC fallback is permitted** when the debt-proxy denominator is zero or WACC evidence is incomplete. It must be labeled illustrative/editable, not company-specific. This fallback does not cure missing required historical inputs such as complete NWC or the reference share price. A date-compatible CAPM evidence set was not assembled; it is unnecessary only if the explicit fallback path is used.

## Follow-up on price, currency, and residual working-capital captions — 2026-10-18

### July 2, 2025 NSE close

The [NSE historical reports page](https://www.nseindia.com/static/resources/historical-reports-capital-market-daily-monthly-archives) identifies “Security-wise Historical Price-Volume Data,” and the [NSE price and volume page](https://www.nseindia.com/historical/price-and-volume-data-per-security) describes security/date filters and a downloadable CSV. The available page view did not expose the requested historical row, and this audit could not retrieve an NSE archive row/file for **INFY**, **2025-07-02**. Search results surfaced INFY futures data, which is not the NSE equity price and was not used. No close is asserted: official dated-price evidence remains unverified. Obtain an NSE archive CSV/bhavcopy row or another official Infosys/NSE document explicitly showing the July 2, 2025 equity close.

### USD-per-share convention and smallest safe proposal

The spec fixes `CompanyDataset.company.currency` to `"USD"`, `SourcedFact.unit` to `"USD_per_share"` for `marketReference.sharePrice`, and monetary model inputs to `USD_millions` (spec data model and EV bridge). `src/domain/company-data.ts` enforces `USD_per_share` for that fact. The bridge multiplies share price by basic shares to produce USD millions; an INR/share price cannot be multiplied directly by USD financial inputs.

**Smallest safe proposal:** keep USD as the model currency and clarify the spec to require converting the verified NSE close to USD/share with an official, valuation-date-matched INR-per-USD FX rate. Preserve the reported INR/share close in provenance; record the FX rate, direction, conversion method, and both source IDs; make clear that the normalized `value` is USD/share. Existing `reportedValue`, `normalizationNote`, and `sourceIds` can support this without formula changes, but the spec should define that `reportedValue` is INR/share and prescribe the FX-rate date/direction. A typed `reportedUnit` field would improve machine-checkability but is not needed for calculation. Native-currency prices would require broader mixed-currency handling or FX logic in the EV bridge, so it is not the smaller change for this USD-only engine. No schema or code change is made here.

### Annual-report breakdown of current working-capital captions

The [FY2025 Integrated Annual Report](https://www.infosys.com/investors/reports-filings/annual-report/annual/documents/infosys-ar-25.pdf) gives consolidated detail in **₹ crore at 2025-03-31**, principally printed pp. 303, 323, 326–327, and 342–344 (balance sheet and Notes 2.5, 2.7–2.10, 2.13–2.16). These reported INR amounts are not combined with rounded USD-million amounts below.

#### Current assets

| Component | ₹ crore | Supported treatment |
|---|---:|---|
| Trade receivables | 31,158 | Include as customer receivables (Note 2.8). |
| Other financial assets: unbilled revenue | 8,183 | Include as operating customer receivable (Note 2.7). |
| Other assets: unbilled revenue | 4,668 | Include as operating contract asset; right to consideration depends on completing milestones (Note 2.10). |
| Vendor advances | 413 | Include as supplier advance (Note 2.10). |
| Prepaid expenses | 3,080 | Include as operating prepayment (Note 2.10). |
| Deferred contract costs | 847 | Include: 343 cost of obtaining contracts + 504 cost of fulfillment (Note 2.10). |
| Restricted deposits | 2,949 | Note 2.7 says these settle employee obligations in the normal course. Operating-linked; keep separate from cash/equivalents. |
| Security deposits | 65 | Separately identified financial asset, but purpose not explained; operating classification unresolved. This updates the earlier USD partial subtotal, which included security deposits without enough purpose evidence. |
| Withholding taxes and others | 2,841 | Note 2.10 says primarily input tax credits and VAT recoverable. Those are operating-linked, but “and others” is not split; exact amount unresolved. |
| Other receivables | 91 | Composition not given (Note 2.10); unresolved. |
| Other financial assets — “Others” | 470 | Composition not given (Note 2.7); unresolved. |
| Interest accrued but not due | 842 | Exclude as investment income. |
| Foreign-currency forwards/options | 192 | Exclude as derivative assets. |
| Net investment in lease | 1,139 | Exclude as lease/lessor asset under proposed operating classification. |
| Employee loans | 249 | Exclude as lending/financial asset (Note 2.6). |
| Income-tax assets | 2,975 | Exclude as income-tax balance; do not net against operating assets. |
| Cash / current investments | 24,455 / 12,482 | Exclude from operating NWC; separately presented in EV bridge. |

The supported operating-linked subtotal, excluding security deposits of undocumented purpose and the mixed/unclassified captions, is **51,298 ₹ crore**: 31,158 + 8,183 + 4,668 + 413 + 3,080 + 847 + 2,949. This remains partial. The 2,841 “withholding taxes and others,” 91 other receivables, and 470 financial “Others” prevent a complete attributed operating-current-asset total.

#### Current liabilities

| Component | ₹ crore | Supported treatment |
|---|---:|---|
| Trade payables | 4,164 | Include as supplier liability (Note 2.14). |
| Unearned revenue | 8,492 | Include as customer contract liability (Note 2.15). |
| Accrued compensation | 4,924 | Include as employee accrual (Note 2.13). |
| Accrued expenses | 8,467 | Include as operating accrual; Note 2.13 lists subcontractors, telecoms, legal/professional charges, marketing, travel, office maintenance, and third-party software/hardware. |
| Compensated absences | 2,908 | Include as employee-benefit liability (Note 2.13). |
| Accrued defined-benefit liability | 6 | Include as employee obligation (Note 2.15). |
| Payable by controlled trusts | 173 | Employee-plan related and operating-linked; identify separately (Note 2.13). |
| Post-sales support and other provisions | 1,325 | Note 2.16 says this “majorly” represents one-year post-sales support. The “other” portion is not split; exact operating amount unresolved. |
| Cybersecurity settlement provision | 150 | Exclude as McCamish incident settlement (Notes 2.16 and 2.24.2). |
| Withholding taxes and others | 3,256 | Note 2.15 provides no full split; unresolved. |
| Other financial liabilities — other payables | 475 | Note 2.13 identifies 67 for technology-asset financing. The remaining 408 (475 − 67) is not composed; exclude 67 and leave 408 unresolved. |
| Capital creditors | 520 | Exclude as capital-expenditure payable (Note 2.13). |
| Option-arrangement liability | 552 | Exclude as financing liability for options over NCI (Note 2.13). |
| FX forward/options liabilities | 63 | Exclude as derivative liability (Note 2.13). |
| Contingent consideration | 11 | Exclude as acquisition consideration (Note 2.13). |
| Current lease liabilities | 2,455 | Exclude under spec convention (balance sheet / Note 2.21). |
| Income-tax liabilities | 4,853 | Exclude as income-tax balance; do not net against operating liabilities. |

Supported operating-linked liabilities excluding unresolved captions total **29,134 ₹ crore**: 4,164 + 8,492 + 4,924 + 8,467 + 2,908 + 6 + 173. This omits the mixed 1,325 provision, 3,256 taxes/others, and 408 other-payables residual, among other unresolved items. It is not complete.

For arithmetic comparison only, adding the full mixed 1,325 provision produces 30,459 ₹ crore. Partial subtotal differences are **22,164 ₹ crore** (51,298 − 29,134) and **20,839 ₹ crore** (51,298 − 30,459). They are not alternative valid NWC answers or a confidence interval. Security-deposit treatment and unresolved components can change the complete result. Do not populate NWC facts from these partial calculations.

### Follow-up conclusion

- **Price:** not verified. No exact dated official NSE equity close was obtained; no price is asserted.
- **Currency:** a spec clarification is needed for converting an INR quote to USD/share while retaining its original unit and source. A same-date official FX conversion with USD internal calculations is the smallest fit; native-currency support would require broader model/bridge changes. No implementation change is made.
- **Operating NWC:** still cannot be calculated defensibly as a complete amount. Several components are classified, but mixed “and others,” unidentified financial assets/payables, and the provision’s other portion remain unresolved.
- **Smallest next step:** retrieve the NSE archive row for `INFY`, `2025-07-02`; resolve the residual current-balance captions; then clarify the spec’s official same-date FX normalization before preparing a dataset.

## Final focused review — 2026-10-18

### Official NSE record for July 2, 2025

The final search found an [Infosys draft Letter of Offer hosted in the NSE corporate archive](https://nsearchives.nseindia.com/corporate/Infosys_22102025144043_SE_Draft_LOA_22102025.pdf), printed pp. 48–49, section 19.3. Its NSE monthly table reports July 2025's daily high as **₹1,649 on July 2**, with the table footnote defining the figure as the high of daily high prices. It separately reports the month's low, average of daily closing prices, and total volume. This official, Infosys-filed document confirms the date's daily high, but **does not state the July 2 closing price**. The daily high is not substituted for the close. The exact July 2, 2025 NSE closing price therefore remains **unverified**. The NSE historical-reports page points to security-wise price/volume archives, but the exact dated equity row/file was not retrievable in this investigation.

### Proposed minimal currency-spec clarification

The existing schema and gate require a USD dataset and a `USD_per_share` market price. Keep that contract and the USD engine. Add this rule to the specification before any Infosys production dataset is prepared:

1. Preserve the source quote as `P_INR`, in INR/share, with its exact quote date and official source reference(s).
2. Obtain a verified official FX observation for that same date. Define `R` as **INR per USD** (INR/USD), and retain its numeric value, date, publisher/source URL, and source reference(s).
3. Calculate `P_USD = P_INR / R`, yielding USD/share. Record the unrounded inputs and calculation; store the converted USD/share as the model-facing `sharePrice.value`, and label its unit `USD_per_share`.
4. Preserve the original `P_INR`, `INR_per_share` unit, quote provenance, FX rate/direction/date/provenance, and conversion formula alongside the normalized value. Existing `reportedValue`, `normalizationNote`, and `sourceIds` can carry the numbers and narrative, but the spec should require an explicit reported unit and FX provenance so the conversion is auditable; if necessary, add only those provenance fields to the schema.
5. Convert the quoted share price before market capitalization is calculated. Every monetary operand in a valuation calculation must be in USD (USD/share times shares gives USD); never combine an INR-denominated price or amount directly with USD-denominated financials. Do not apply another FX conversion to the already normalized share price.

This is ready for approval as a narrow specification change. It does not assert an FX rate or a converted price and does not change the production schema, gate, or formulas in this audit. Prefer explicit fields for `reportedUnit`, `fxRate`, `fxRateUnit` (`INR_per_USD`), `fxAsOf`, and `fxSourceIds` over relying solely on free-text normalization notes.

### Final residual operating-NWC review

The consolidated FY2024–25 annual-report Notes 2.7, 2.10, 2.13, 2.15, and 2.16 (printed pp. 326–327 and 342–344) provide the reported breakdowns recorded above, in INR crore as of **2025-03-31**. They do not further split the remaining mixed captions: current assets' “withholding taxes and others” ₹2,841 crore, “other receivables” ₹91 crore, and financial “others” ₹470 crore; current liabilities' “withholding taxes and others” ₹3,256 crore, the “others” portion within ₹1,325 crore post-sales-support-and-other provisions, and the ₹408 crore residual after the specifically identified ₹67 crore technology-asset financing item in other payables. The report says input tax credits/VAT are the primary content of the mixed asset caption and post-sales support is the major content of the provision; neither wording supplies exact component values. No unsupported split or classification is inferred.

Accordingly, **complete operating NWC is not defensible from the reviewed official report**. The ₹51,298 crore operating-linked asset subtotal and ₹29,134 crore clearly classified liability subtotal remain partial; neither their difference nor the alternate partial arithmetic that includes all ₹1,325 crore provision is a complete NWC input. The current operating NWC eligibility requirement remains unmet.

### Current decision and minimum next work

- Official July 2 NSE closing price: **not verified**. The official filing supports only the ₹1,649 daily high for that date.
- Currency proposal: **ready for approval** as the minimal USD-preserving normalization rule above; implementation and an actual date-matched FX observation remain outstanding.
- Complete operating NWC: **not defensible** from the available annual-report note detail.
- Eligibility: **Infosys still cannot pass the current gate**, even after the proposed currency-spec change. The unresolved exact close and complete operating NWC independently block eligibility; a date-matched FX source/rate and any required share-count refresh also remain necessary for a future dataset.
- Minimum remaining work: approve and implement the narrow currency provenance rule; obtain an official dated NSE close and same-date official INR-per-USD rate; obtain an authoritative granular reconciliation of the unresolved NWC captions (or choose a different candidate with fully classifiable working-capital data). Until those evidence requirements are met, keep Infosys ineligible and resume product development without a real-company dataset if the deadline requires it.

## Combined eligibility decision

Resolved: FY2025 revenue, EBIT, pretax income, income-tax expense, pure D&A, capex, the USD reporting basis, cash, current investments and their separation from cash, explicit issuer preferred-equity zero, NCI, date-specific share count, no-borrowings debt balances, finance-cost treatment, and the permitted illustrative WACC fallback.

Unresolved: complete base-year operating current assets and liabilities (mixed residual captions remain); exact NSE close for the chosen valuation date; and an approved way to map the INR/share quote to the schema’s USD/share unit. Basic shares are reported at March 31 and should be rechecked against any share activity before the eventual valuation date. No full source-complete audit manifest/default package has been prepared.

**Infosys cannot pass the current eligibility gate honestly yet.** The smallest next step is to obtain the exact NSE close for a fixed post-filing date and settle the currency-normalization convention, then obtain a more granular source reconciliation for the residual Note 2.4 current financial assets and Note 2.5 current liabilities (including the “other” components) so complete operating NWC can be computed. Keep Infosys unavailable until those items are supported.
