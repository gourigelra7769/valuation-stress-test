# Apple source audit (not eligible)

Research captured **2026-10-18**. This is an evidence-gap audit only. Apple remains `candidate` in `data/companies/index.json`; no production dataset or valuation inputs are created here.

## Reference dates and units

- Company: Apple Inc. (AAPL), Nasdaq; reporting and valuation currency USD.
- Latest complete fiscal year used for the base-year review: FY2025, ended **2025-09-27** (52 weeks).
- Latest balance sheet found before the proposed reference date: **2026-06-27**, from Apple’s Q3 FY2026 Form 10-Q filed 2026-07-31.
- Proposed market reference date: **2026-10-16** close. Yahoo Finance historical data reports $343.46/share. This is a secondary quote and needs an acceptable source record before any production use.
- SEC financial statement amounts below are **USD millions**, unless noted. Candidate schema normalizes shares to **millions of shares**, prices to **USD/share**, and rates to decimals. The filing’s share cover count is in actual shares and must be divided by 1,000,000 if used in the schema.

## Sources consulted

1. [Apple FY2025 Form 10-K, SEC](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm), filed 2025-10-31; audited fiscal year ended 2025-09-27. Relevant sections: consolidated statements of operations (p.29), balance sheets (p.31), cash flows (p.33), Notes 1, 4, 5, 6, 7 and 8. Accessed 2026-10-18.
2. [Apple Q3 FY2026 Form 10-Q, SEC](https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/aapl-20260627.htm), filed 2026-07-31; quarter ended 2026-06-27. Relevant sections: cover, condensed consolidated balance sheets (p.3), cash flows, Notes 4 (receivables), 6 (debt), and 7 (shareholders’ equity). Accessed 2026-10-18. [SEC filing index](https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/0000320193-26-000020-index.htm).
3. [Yahoo Finance AAPL historical prices](https://finance.yahoo.com/quote/AAPL/history/), accessed 2026-10-18; historical table reports 2026-10-16 close $343.46. Secondary market-price evidence only.
4. [Apple Investor Relations FAQ](https://investor.apple.com/investor-relations/faq/default.aspx), accessed 2026-10-18. The FAQ currently answers “No” to whether preferred stock is outstanding. It does not state an as-of date or identify the balance at 2026-06-27, so it is not used to source a June 27 zero.

## Evidence inventory

| Required field / issue | Evidence and calculation | Evidence date, unit | Status |
|---|---|---|---|
| Revenue | FY2025 net sales: 416,161. | FY ended 2025-09-27; USD millions | Supported by audited 10-K. |
| EBIT | FY2025 operating income: 133,050. | FY ended 2025-09-27; USD millions | Supported by audited 10-K. |
| Pretax income / income tax | Income before tax 132,729; provision for income taxes 20,719. Tax-rate arithmetic for audit only: 20,719 / 132,729 = approximately 15.61%. This includes Apple’s reported FY2025 tax results; the filing discusses a one-time FY2024 State Aid charge, not an FY2025 adjustment. | FY ended 2025-09-27; USD millions; calculated rate decimal | Supported. Keep the reported figures and derived rate distinct. |
| D&A | Cash-flow statement explicitly labels “Depreciation and amortization” at 11,698; it does not append “and other.” The note separately reports PP&E depreciation rounded to $8.0 billion, but that rounded component is not substituted for the more precise combined D&A line. | FY ended 2025-09-27; USD millions | **Resolved:** 11,698 is a pure, sufficiently precise D&A input at filing precision. |
| CapEx | Cash-flow statement reports “Payments for acquisition of property, plant and equipment” as (12,715). Under the spec’s positive-spend input convention, the normalized magnitude would be 12,715, retaining the reported negative cash-flow sign in provenance. | FY ended 2025-09-27; USD millions | Supported. |
| Interest expense | FY2025 operations statement reports a net “Other income/(expense), net” amount of (321), but that is not a separately identified interest-expense figure. The reviewed 10-K does not provide a precise FY2025 interest expense amount in the required input form. It would be incorrect to use the net other-income line or derive gross interest expense from it. | FY ended 2025-09-27; USD millions | **Unresolved required field.** Need a filing disclosure or other reliable primary source that isolates FY2025 interest expense (not net interest/other expense). |
| Base-year beginning / ending interest-bearing debt | Comparative FY2024 and FY2025 balance sheets list commercial paper and current/noncurrent term debt. Sum CP + current term debt + noncurrent term debt at each year end; exclude lease liabilities. FY2024 beginning debt: 9,967 + 10,912 + 85,750 = **106,629**. FY2025 ending debt: 7,979 + 12,350 + 78,328 = **98,657**. | 2024-09-28 and 2025-09-27; USD millions | Supported calculation from comparative audited balance sheets. |
| Latest balance-sheet date and debt | Q3 FY2026 balance sheet dated 2026-06-27: commercial paper 1,997 + current term debt 11,007 + noncurrent term debt 71,340 = **84,344**. Lease liabilities are not included in this sum. Debt note 6 reports total term-debt carrying amount rounded to $82.3 billion, consistent with current plus noncurrent term debt at displayed balance-sheet precision. | 2026-06-27; USD millions | Supported calculation from primary statements. |
| Cash and cash equivalents | 39,544 on Q3 FY2026 balance sheet. | 2026-06-27; USD millions | Supported. Deduct once in reference EV. |
| Current marketable securities | Separately presented current marketable securities 22,855. The balance sheet separately presents noncurrent marketable securities 84,118; only the current line is eligible for the spec’s separate short-term-security deduction. No evidence indicates the separately captioned current marketable securities are included in cash and cash equivalents. | 2026-06-27; USD millions | Supported classification; deduct current 22,855 once, separately from cash. Do not deduct noncurrent securities under this convention. |
| Preferred equity | Q3 balance sheet/equity statement presents common stock and APIC, retained earnings, accumulated OCI, and total shareholders’ equity; it gives no separate preferred-equity line. The IR FAQ says no preferred stock is currently outstanding but has no reporting/as-of date and was accessed after the proposed valuation date. Absence of a line is not treated as zero. | Needed 2026-06-27; USD millions | **Unresolved:** no explicit, date-compatible source for the 2026-06-27 preferred-equity balance (including explicit zero). |
| Non-controlling interest | Reviewed FY2025 10-K and Q3 FY2026 10-Q do not provide an explicit NCI balance or an explicit statement that it is zero. Absence of a separate line is insufficient. | Needed 2026-06-27; USD millions | **Unresolved:** require explicit, date-compatible evidence of the balance or no NCI. |
| Latest basic shares | Q3 10-Q cover reports 14,594,180,000 common shares outstanding as of 2026-07-17. Normalize to 14,594.180 million shares. The 2026-07-17 count precedes 2026-10-16. | 2026-07-17; actual shares, normalized millions | Supported as a dated share count; verify it is the spec-approved basic-share convention at the eventual market date. |
| Share price | Yahoo Finance reports $343.46 close on 2026-10-16. | 2026-10-16; USD/share | Secondary evidence; source completeness/acceptance for a production dataset remains to be documented. |
| Forecast defaults and WACC | These are editable model assumptions, not historical facts. The spec allows an explicitly illustrative WACC fallback; no dated CAPM package was assembled in this audit. Any populated default must be labeled and sourced/method-documented under the schema. | Valuation reference 2026-10-16; decimal rates | Not an eligibility evidence substitute for missing historical facts. |

## Operating working-capital classification

The required base-year operating current assets and liabilities refer to FY2025 year-end, **2025-09-27**. The latest balance sheet for the equity bridge is later (2026-06-27); those dates must not be mixed. Proposed classification uses current operating receivables, inventory, and operating liabilities, while excluding cash, marketable securities, and interest-bearing debt as required by the specification.

### FY2025 base-year, at 2025-09-27

The audited balance sheet reports (USD millions): cash 35,934; current marketable securities 18,763; accounts receivable 39,777; vendor non-trade receivables 33,180; inventories 5,718; other current assets 14,585; accounts payable 69,860; other current liabilities 66,387; deferred revenue 9,055; commercial paper 7,979; current term debt 12,350. Note 6 breaks FY2025 other current liabilities into income taxes payable 13,016, accrued distribution and marketing 8,919, and residual other current liabilities 44,452.

| Line | USD millions | Proposed classification and evidence |
|---|---:|---|
| Accounts receivable, net | 39,777 | Include: current trade receivables on balance sheet. |
| Vendor non-trade receivables | 33,180 | Include as operating: Note 4 says these arise from components sold to manufacturing vendors and gains reduce product cost of sales when final products are sold. |
| Inventories | 5,718 | Include: current operating inventory. |
| Other current assets | 14,585 | Unresolved aggregate. No sufficient FY2025 note reconciliation was located to classify all constituents as operating and exclude financial/non-operating items. Do not include wholesale without that support. |
| Cash and cash equivalents | 35,934 | Exclude from operating NWC; separately reflected in reference EV bridge. |
| Current marketable securities | 18,763 | Exclude from operating NWC; separately reflected in reference EV bridge under the short-term security rule. |
| Accounts payable | 69,860 | Include: operating supplier liability. |
| Deferred revenue | 9,055 | Include: operating customer contract liability. |
| Income taxes payable | 13,016 | Proposed include as an operating current liability under the existing operating-NWC definition; explicitly disclosed in Note 6. |
| Accrued distribution and marketing | 8,919 | Include: selling/distribution operating accrual, separately disclosed in Note 6. |
| Residual other current liabilities | 44,452 | Unresolved aggregate. The filing does not provide enough detail to separate operating accruals from lease/financing or other non-operating components. Do not include wholesale. |
| Commercial paper and current term debt | 20,329 combined | Exclude from operating NWC: interest-bearing financing debt included in the enterprise-value bridge. |

Clearly classifiable asset subtotal is **78,675** (39,777 + 33,180 + 5,718). Clearly classifiable liability subtotal is **100,850** (69,860 + 9,055 + 13,016 + 8,919). Their difference, **(22,175)**, is only a partial subtotal, not complete NWC. The unresolved $14,585 current-asset aggregate and $44,452 residual-current-liability aggregate prevent a complete supported FY2025 operating NWC value.

### Latest balance-sheet cross-check, at 2026-06-27

Q3 10-Q reports AR 31,398 + vendor non-trade receivables 27,509 + inventory 11,092; cash 39,544 and current marketable securities 22,855 are excluded. Known operating asset subtotal is **69,999**. It reports AP 64,525 and deferred revenue 9,538; commercial paper 1,997 and current term debt 11,007 are excluded. Known liability subtotal is **74,063**. This partial difference **(4,064)** is not the base-year NWC and is not complete. Current other assets of 17,420 and other current liabilities of 62,259 are not sufficiently disaggregated in the Q3 filing; they remain unclassified. The nine-month cash-flow changes combine current and noncurrent asset/liability movements and do not supply the missing point-in-time splits.

## D&A, equity bridge, and NWC conclusions

- **Pure D&A: resolved** for FY2025 at the filing’s USD-million precision by the standalone cash-flow caption “Depreciation and amortization” (11,698). Do not use the rounded PP&E depreciation note as a replacement.
- **Preferred equity: unresolved** at the required 2026-06-27 date. The later-accessed, undated FAQ is not date-matched evidence. Do not assign zero.
- **Non-controlling interests: unresolved.** No explicit zero or amount was found for 2026-06-27. Do not infer zero from statement presentation.
- **Operating NWC: unresolved.** Classification for named AR/vendor receivables/inventory, AP/deferred revenue, and FY2025 taxes/accrued distribution and marketing is supported. The complete FY2025 totals remain unknown because “other current assets” and residual “other current liabilities” are not fully classified. The Q3 figures also have aggregate residuals and cannot replace the FY2025 base-year facts.
- **Additional required-field gap:** FY2025 interest expense is not isolated from the net “Other income/(expense)” line in the reviewed filing. This mandatory schema fact also blocks eligibility.

## Final bounded evidence check — 2026-10-18

This pass checked the already-cited FY2025 10-K and Q3 FY2026 10-Q for the remaining required facts, and checked Nasdaq’s historical-quote page for the proposed reference date.

- **Interest expense — remains unresolved:** the [FY2025 SEC Form 10-K](https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/aapl-20250927.htm), consolidated statement of operations (p.29), reports only “Other income/(expense), net” of **$(321) million** for the year ended 2025-09-27. Item 7A’s interest-rate-risk discussion (p.27) gives rate sensitivity, not FY2025 interest expense. The reviewed Q3 FY2026 10-Q also does not supply this missing full-year amount. Neither net other expense nor a sensitivity figure can be substituted for interest expense.
- **Preferred equity and NCI — remain unresolved:** the [Q3 FY2026 SEC 10-Q](https://www.sec.gov/Archives/edgar/data/320193/000032019326000020/aapl-20260627.htm), balance sheet (p.3) and equity statement, do not explicitly state a zero balance for either item. The FY2025 10-K’s financial statements and the IR FAQ already cited do not provide explicit, date-matched balances at 2026-06-27. Absence of a balance-sheet line is not evidence of zero.
- **Operating NWC — remains unresolved:** the reviewed FY2025 10-K Note 6 disaggregates FY2025 other current liabilities only into income taxes payable 13,016, accrued distribution/marketing 8,919, and residual other current liabilities 44,452 (USD millions). It does not classify that residual or the 14,585 “other current assets” balance sufficiently to produce complete operating current asset and liability totals. The Q3 10-Q has larger undisaggregated other-current balances and does not repair the base-year gap.
- **Market price — date-matched secondary quote available; primary quote not obtained:** Nasdaq’s [AAPL Historical Quotes page](https://www.nasdaq.com/market-activity/stocks/aapl/historical) was checked on 2026-10-18 but showed “Data is currently not available,” with no 2026-10-16 close visible. The previously recorded Yahoo close of $343.46 is date-matched secondary evidence, not an exchange-published row. This investigation did not obtain a primary exchange quote. The current gate requires a sourced/date-matched price and does not validate source-publisher authority; whether to accept the secondary source is an audit policy decision, not a validation rule.
- **D&A — remains resolved:** no contrary evidence was found; the FY2025 cash-flow caption remains the precise pure D&A source as recorded above.

## Eligibility decision and smallest next step

The runtime eligibility gate in `src/domain/company-data.ts` requires sourced facts for the market quote and shares; FY2025 revenue, EBIT, pretax income, tax expense, pure D&A, normalized capex, complete operating current assets/liabilities, interest expense, and beginning/ending interest-bearing debt; and same-date latest-balance-sheet debt, cash, preferred equity, and NCI. It also requires source/date consistency, explicit source-complete audit checks, and a resolved short-term marketable-securities classification without cash overlap.

Apple **cannot pass the current gate honestly**. D&A, capex, key statements, debt bridge, cash, and separately reported current securities have support, but eligibility is blocked by unresolved FY2025 interest expense, complete base-year operating NWC classifications, and explicit dated preferred-equity and NCI balances. A date-matched secondary quote exists; the primary quote lookup was inconclusive, and the gate itself does not specify a source hierarchy. No fact has been set to zero or promoted into a production dataset, and the eligibility gate and formulas are unchanged.

**Smallest next step:** obtain primary, date-compatible evidence that explicitly resolves preferred equity and NCI at 2026-06-27 and an auditable breakdown of FY2025 “other current assets” and residual “other current liabilities”; separately locate an exact FY2025 interest-expense disclosure. Until those items are sourced, keep Apple ineligible. No code tests or typecheck were run because this change is audit documentation only.
