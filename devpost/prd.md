---
doc: prd
status: approved
---

# Valuation Stress-Test Engine - Product Requirements

A responsive, single-page equity research dashboard for finance learners and beginner investors to see which assumptions support a dated company valuation and how changes affect it.

Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey

1. On first launch, show the Microsoft dashboard in Reverse DCF mode only if its fixed, documented data set passes the same completeness, source-attribution, date-consistency, and input-validation checks required of every supported company. Microsoft is the first end-to-end candidate, not guaranteed support. Load its dated reference valuation and documented defaults deterministically. If it fails validation, show an explanatory data-unavailable state; do not show placeholder financial results. Keep the company selector visible.
2. Show the company/ticker, market-price valuation date, USD units, dated share price, source-backed financial inputs, and the calculated market-implied enterprise value with its formula and source dates. Clearly distinguish sourced facts, model assumptions, and calculated results.
3. In default Reverse DCF mode, hold market-implied enterprise value fixed as target and solve for constant annual revenue growth. Show implied growth, target EV, modeled EV at the solution, and assumptions held fixed. If no valid growth exists within the supported range, show the defined no-solution state.
4. Change operating margin, WACC, or terminal growth and immediately recalculate the reverse solution and equal-value chart. Growth remains solver-controlled in this mode; the interface must not imply it is user-entered.
5. Explore the growth-versus-margin equal-value chart. Each available point shows the growth rate that matches the same fixed target EV at that margin, keeping all other assumptions fixed. No-root margins appear as unavailable gaps.
6. Switch explicitly to Forward Valuation mode to set revenue growth directly. The fixed reference EV remains visible while modeled EV and estimated equity value per share update. Switch back to Reverse DCF to recalculate solver growth from the current assumptions.
7. Select another verified company. Keep the selected mode, load the newly selected company's dated reference EV, source-backed inputs, and company-specific documented default assumptions, then recalculate. Show a concise notice that that company's defaults were loaded.

When no real company passes eligibility, the home route stays in its company-data-unavailable state. It may link to a separate `/demo` educational route that runs a deterministic fictional scenario. That route is explicitly outside the verified-company selector and must keep the persistent label **FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA** visible. It has no real issuer, ticker, market quote, source links, or verification claim.

The educational route distinguishes fictional scenario inputs, user-selected assumptions, and calculated outputs. It uses the existing DCF engine, reverse solver, and chart generator; its target EV is calculated from the fictional baseline inputs. The route does not create a company record and is never used to satisfy eligibility.

Source: `scope.md > The Core Loop`, `scope.md > What "Working" Looks Like`, `scope.md > The POC Boundary`.

## Screens and Layout

The MVP has one responsive dashboard surface and no marketing homepage, chatbot-first interface, or unnecessary navigation. The dashboard information hierarchy is:

1. **Company and reference context:** visible company selector, company name/ticker, market-price valuation date, currency, share price, and a clear note that market-implied EV is calculated from dated inputs rather than directly quoted.
2. **Key valuation result:** in Reverse DCF, prominently show implied annual growth, fixed target EV, modeled EV at solution, and solution status. In Forward Valuation, show user-selected growth and modeled EV alongside the fixed reference EV.
3. **Assumptions:** controls for growth, operating margin, and WACC; show terminal growth and other fixed assumptions with concise explanations. Label growth as solver-controlled in Reverse DCF and user-controlled in Forward Valuation.
4. **Main visualization:** growth-versus-operating-margin equal-value chart as the visual centerpiece, with target EV, current assumption point, units, supported axis ranges, and unavailable regions clearly shown.
5. **Supporting details:** modeled EV, estimated equity value per share, terminal-value contribution, and a compact source-input view with links, dates, and units.

Keep the core lesson understandable without extensive scrolling. On narrow screens, preserve the same information order and keep the chart and key result easy to reach.

Source: `scope.md > Inspiration & Identity`, `scope.md > What "Working" Looks Like`.

## Look and Feel

Use a polished equity-research-terminal feel: professional, restrained, analytical, data-dense but readable. Use strong typography, restrained colors, clear USD units, well-labeled charts, and concise explanations or tooltips for unfamiliar terms. Use distinct visual treatments for sourced inputs, user assumptions, and calculated outputs. Avoid generic AI-app styling, chat-first presentation, and visual treatments that make estimates look like facts.

Source: `scope.md > Inspiration & Identity`.

## Features and Behavior

### Company and Reference Valuation

- Microsoft is the first end-to-end company candidate, not guaranteed support. It becomes selectable only after its full dataset passes every completeness, source-attribution, date-consistency, and input-validation check. Apple and NVIDIA are conditional audit candidates; neither appears in the selector before passing the same full audit. If their data cannot be verified within the hackathon timeline, prioritize releasing with one fully verified company rather than incomplete datasets.
- Selecting a different company loads that company's own dated reference valuation, sourced input set, and documented default assumptions. It does not carry over the previous company's company-specific data or scenario assumptions. The current valuation mode remains selected. Show a notice such as "Loaded default assumptions for Microsoft." Do not retain or compare prior company scenarios in the MVP.
- The reference market-implied EV remains fixed while the user changes model assumptions. Calculate it as share price * basic common shares + interest-bearing debt + reported preferred equity + reported non-controlling interest - cash and cash equivalents - separately reported short-term marketable securities classified as current assets, when the source supports the classification and amount. Define cash as cash and cash equivalents reported by the company; do not subtract marketable securities already included in that cash figure. Show each included amount, classification, source, reporting date, and market-price valuation date. Apply the identical definition in the modeled equity-value-per-share bridge: (modeled EV - debt - preferred equity - non-controlling interest + cash and cash equivalents + eligible current short-term marketable securities) / basic common shares. Do not include long-term investments or lease liabilities in this MVP bridge.
- Basic shares are a simplified modeling convention. Label the resulting equity value per share as an estimate that may differ from valuations using diluted shares or other market-data conventions. Use the same basic-share convention for market capitalization and the equity-value-per-share bridge.
- Show market-price valuation date and latest filing/reporting dates for balance sheet inputs, which may differ. Cite every sourced input with a clickable source, date, and unit. Clearly label calculated values, assumptions, and historical facts.

Acceptance criteria:

- Initial launch deterministically loads Microsoft only when its dataset passes the same completeness and validation rules as other companies; otherwise, show the explanatory unavailable state without financial placeholders.
- If no eligible company is available, retain the unavailable state and provide a clearly separate link to `/demo`. The fictional example must never appear in the selector, company manifest, source-backed input list, or as a verified company.
- Company selection loads the selected company's source data and documented defaults, keeps the current mode, recalculates outputs, and displays a visible notice. No prior company financial input appears in the newly loaded context.
- Market-implied EV is labeled as derived and displays its formula inputs, share-count convention, and dates. Cash and eligible current short-term marketable securities are separately itemized, classified, sourced, and not double-counted. The same definition is used in the modeled equity bridge. Estimated per-share output includes the basic-share convention caveat.
- Every sourced input shown has a source link, as-of/reporting date, and unit; assumptions and calculated outputs have different labels or visual treatment.

### FCFF/WACC Valuation

- Use the approved scope's single annual five-year FCFF/WACC convention for every company. Base year is the latest complete fiscal year with source-backed inputs.
- Historical effective tax rate = reported income tax expense / reported pre-tax income for the base year. It is eligible only when pre-tax income is positive and the resulting rate is 0%-40%, inclusive. Do not silently clamp or substitute an invalid rate. The model applies this fixed rate to forecast EBIT; clearly disclose that this simplified treatment excludes tax-loss carryforwards, changing tax rates, and other tax adjustments. The initial company set must have positive base EBIT.
- Use latest complete FY EBIT / revenue as the historical operating-margin baseline. Keep this historical observation distinct from the editable forecast-margin assumption. The proposed forecast-control range is 0%-70% and is validated separately from the historical ratio. A historical baseline outside the forecast range does not by itself fail the company data audit or remove the company from the selector; the baseline remains visible with its source and date. Do not silently clip it to the forecast range.
- Project revenue at a constant selected annual growth rate; EBIT at the selected constant forecast operating margin; taxes at the fixed base-year historical effective rate; D&A and CapEx using fixed base-year ratios to revenue; and change in operating NWC using fixed base-year NWC/revenue multiplied by the change in revenue. Operating NWC is operating current assets less operating current liabilities, excluding cash and interest-bearing debt; it may be negative.
- Revenue growth defaults to 5%, an illustrative, editable scenario input, not a market expectation. The reverse solver's supported search range is -20% to 50%; this technical range does not claim every value is reasonable for every company. If a default is outside a validated supported range, explain the mismatch and require a valid assumption rather than silently clipping it.
- WACC uses the proposed CAPM-based method only if required inputs are traceable and date-compatible with the valuation snapshot. Record each input's source, value, date, unit, and calculation: risk-free rate is the U.S. 10-year Treasury par yield on the valuation date; beta is the latest available U.S. unlevered industry beta published on or before that date, re-levered using company debt/market equity and the historical tax rate; equity risk premium is the latest available U.S. implied ERP published on or before that date; cost of equity = risk-free rate + levered beta * ERP; pre-tax cost of debt = latest complete FY interest expense / average interest-bearing debt. Label the latter a historical cost-of-debt proxy, not a current borrowing rate. WACC weights equity at market value and debt at reported value; tax-adjust debt cost with the historical tax rate. If required WACC inputs cannot be verified, use 9.5% only as an explicitly illustrative, editable fallback; never label it a calculated company-specific estimate.
- Terminal growth defaults to 2%, explicitly illustrative and editable. Its supported range is 0%-4%, subject to terminal growth < WACC and a minimum 0.5 percentage-point gap below WACC. With the proposed WACC range of 5%-20%, the ranges are compatible; validate terminal growth <= min(4%, WACC - 0.5 percentage points). If future range changes make the gap impossible, resolve the ranges before implementation.
- Calculate FCFF = EBIT - taxes + D&A - CapEx - change in NWC. Discount year-end annual FCFF at WACC. Calculate year-five terminal value as FCFF[5] * (1 + terminal growth) / (WACC - terminal growth), discount it, and add it to forecast FCFF present value. Terminal growth must be below WACC. Show terminal-value present value as a share of modeled EV.
- Bridge modeled EV to estimated equity value per share as (modeled EV - debt - preferred equity - non-controlling interest + cash and cash equivalents + separately reported current short-term marketable securities) / basic common shares. Subtract cash and cash equivalents from EV only once; include current short-term marketable securities only when separately classified and source-supported. Show each source date and amount. Include reported preferred equity and non-controlling interest; disclose any unavailable adjustment and its effect. Exclude long-term investments and lease liabilities.

Acceptance criteria:

- With a fixed documented fixture, independently calculated annual revenue, EBIT, taxes, D&A, CapEx, change in NWC, FCFF, present value, terminal value, EV, and equity value per share agree within 0.01% (or displayed rounding tolerance for per-share output). Identical inputs produce identical outputs. Terminal-value contribution equals terminal-value present value / modeled EV.
- Historical tax rates with non-positive pre-tax income, rates below 0%, or rates above 40% are rejected with a clear explanation and never silently replaced. Forecast tax calculations visibly use the fixed historical rate and the product explains the exclusions.
- Invalid inputs including WACC <= terminal growth, non-positive share count, negative revenue, negative D&A or CapEx, non-finite values, unsupported rates/ratios, and missing required source inputs are explained before outputs are presented. Negative operating NWC is accepted when derived from attributed operating balances.
- Revenue growth controls/search are limited to -20% through 50%; this supported solver range is labeled as a model boundary, not a claim of reasonable outcomes for every company. The 5% default is labeled illustrative and editable.
- Historical operating margin is displayed as a sourced-derived baseline even if it lies outside the 0%-70% proposed forecast-control range; that condition alone does not fail company eligibility. Forecast margin input is validated against its separate supported range and is never silently clipped.
- A calculated WACC is shown as company-specific only when every required input and date passes the documented traceability checks. The 9.5% fallback is visibly labeled illustrative and editable, not company-calculated. The interest-expense/average-debt input is explicitly labeled historical proxy.
- Terminal growth defaults to illustrative 2%, remains within 0%-4%, and is always strictly below WACC with the proposed minimum 0.5 percentage-point gap. Range validation enforces the dynamic upper bound.

### Automated Test Requirements

Automated tests are required for numerical correctness and important user-visible state transitions; visual inspection alone is insufficient.

- **DCF calculations:** A fixed documented fixture checks annual forecast values, FCFF, discounting, terminal value, EV, and equity value per share against independent expected calculations within the numerical tolerances above. Identical inputs return identical results.
- **Reverse-solver recovery:** A target generated from a known valid growth rate recovers within 0.01 percentage points and matches target EV within 0.01%.
- **No-root cases:** A target outside the supported range returns explicit no-solution without clamping/fabrication. Tests distinguish known no-root, invalid-input, and numerical-failure states where possible.
- **Invalid inputs:** Cover WACC <= terminal growth, invalid share count, negative revenue, negative D&A or CapEx, non-finite values, unsupported rates/ratios, missing source inputs, and unsupported marketable-security classification. Negative operating NWC remains valid when sourced.
- **Mode switching:** Verify shared assumptions and company selection persist across mode changes; Reverse DCF growth is solver-controlled; Forward Valuation growth is user-controlled; last-valid/user/default growth transfer rules work; and mode never changes silently.
- **Equal-value chart:** For known valid margin values, each computed growth point uses the same DCF engine and solver and matches target EV within 0.1%. No-root margin values appear unavailable, leave gaps, and are not bridged by interpolation.
- **Company/default loading:** Microsoft appears only after its full audit passes; Apple and NVIDIA remain unavailable until their audits pass; changing companies loads that company's defaults, retains the mode, and does not leak prior-company inputs. If only one company passes, it remains usable without placeholders.

### Reverse DCF Mode

- Reverse DCF is the default mode. Keep the dated market-implied EV fixed as target and solve for the constant annual revenue growth rate that matches it, holding operating margin, tax, D&A/revenue, CapEx/revenue, NWC/revenue, WACC, terminal growth, and EV adjustments fixed.
- Show implied growth, fixed target EV, modeled EV at the solution, solution status, supported growth range, and fixed assumptions. Growth is solver-controlled and cannot be manually edited in this mode.
- Changing operating margin, WACC, or terminal growth recalculates the required growth, modeled EV at the solution, and equal-value chart without changing the target EV or other assumptions.

Acceptance criteria:

- For a target EV generated by a known valid growth assumption, recover growth within 0.01 percentage points and match target EV within 0.01%.
- If the target has no root in the supported growth range, show a no-valid-solution state and the supported range. Never fabricate or clamp a result.
- A confirmed no-root result is distinguished from numerical solver failure and invalid model inputs where possible, with a plain-language reason.

### Forward Valuation Mode

- The user can explicitly switch to Forward Valuation and directly set annual revenue growth. Calculate modeled EV and estimated equity value per share from that input while keeping the dated market-implied EV fixed and visible for comparison.
- Do not change modes when the user attempts to adjust growth. The mode switch is explicit. In Reverse DCF, growth is solver-controlled; in Forward Valuation, it is user-controlled.
- Share operating margin, WACC, terminal growth, company context, and other current assumptions between modes. On switching from Reverse DCF, initialize Forward growth from the last valid implied growth if available; otherwise preserve the last user-selected growth value, or use the company's documented default if none exists. On switching back, preserve the Forward growth as context, but recalculate the reverse solution from current assumptions. Never label a solver result as a user input or vice versa.

Acceptance criteria:

- Switching modes preserves the selected company and all shared assumptions. It changes only the growth-control behavior and calculation described above.
- Forward mode growth edits update modeled EV and estimated per-share value while the reference EV remains unchanged. The result identifies the growth input used.
- Reverse mode does not permit manual growth edits and recalculates solver growth on entry from the current assumptions, regardless of the preserved Forward growth context.

### Growth-versus-Margin Equal-Value Chart

- Make this the main visual. For each supported operating-margin value on the displayed margin range, solve for the revenue growth that matches the single fixed target EV, keeping all other assumptions fixed.
- Use the same deterministic DCF calculation and reverse solver as Reverse DCF mode. Show target EV, the current assumption point, axis units/ranges, and unavailable regions. Recalculate the curve when company or fixed assumptions change.
- If a margin has no valid growth solution in the supported range, mark it unavailable and leave a visible gap. Do not interpolate or draw a false continuous solution across gaps.

Acceptance criteria:

- Every plotted point is produced by the same DCF engine and solver. Recalculating DCF at each available plotted growth/margin pair matches target EV within 0.1%.
- No-root points are marked unavailable and not connected through. Changing WACC or another fixed assumption updates the curve consistently with the updated target context.

### No-Solution, Invalid, and Data-Unavailable States

- A no-valid-solution state does not blank the dashboard. Keep the fixed reference EV, sourced inputs, valuation date, and active assumptions visible. Show the supported growth range and explain no valid match was found in that range.
- Show modeled EV or other calculated outputs only when valid for clearly identified inputs; never present a forward scenario or arbitrary trial point as a matched Reverse DCF result.
- Distinguish a confirmed no-root result within the supported range from numerical solver failure or invalid model input when possible. Give a plain-language reason and allow assumption changes or explicit switch to Forward Valuation.
- In the equal-value chart, mark no-root margin points unavailable and leave gaps while keeping target EV and current assumptions in context.
- Missing or inconsistent data must not be silently filled, mixed across dates, or rendered as realistic-looking placeholder output. Exclude the company until resolved, or show an explanatory unavailable state. Invalid model inputs block affected calculations and explain why.

Acceptance criteria:

- A no-root scenario preserves reference and source context and never shows a matched reverse result. Any independent outputs identify the exact inputs used.
- Invalid model inputs and solver failures have distinct states/messages from confirmed no-root when the cause can be identified.
- Switching to Forward Valuation remains available from a no-root state and produces outputs only for valid user-selected assumptions.

Source: `scope.md > The POC Boundary`, `scope.md > Acceptance Criteria`.

## States and Boundaries

- **First launch, valid default:** Microsoft loads in Reverse DCF mode only after its full dataset audit passes, with dated data, documented defaults, calculated reference EV, and chart. Only fully verified company choices appear in the selector.
- **First launch, invalid/missing default data:** show a clear data-unavailable explanation without fabricated financial values or an apparently real chart.
- **Normal Reverse DCF:** show solver-controlled growth and the matched modeled EV for current assumptions.
- **Normal Forward Valuation:** show user-controlled growth and forward modeled EV beside the unchanged reference EV.
- **Confirmed no solution:** preserve independent reference and source information, show supported range and active assumptions, omit matched-solution claims, and leave unavailable chart gaps.
- **Invalid input or solver failure:** explain the input or calculation problem; do not render affected results as valid.
- **Company change:** keep mode, load the new company defaults and source data, recalculate, and visibly confirm defaults were loaded.
- **Persistence:** no accounts, saved scenarios, or prior-company comparison are in the MVP; session assumptions need not be retained after the user leaves.

## Product Decisions

- One responsive dashboard, no marketing home page or chatbot-first experience.
- Reverse DCF is the default mode; Forward Valuation is explicit and secondary. Shared assumptions carry across mode changes, with growth behavior switching by mode.
- Selecting a company loads that company's defaults instead of carrying over another company's company-specific assumptions; the current mode remains unchanged.
- Microsoft is the first end-to-end candidate, not guaranteed support; it becomes selectable only after its full dataset audit passes. Apple and NVIDIA are conditional audit candidates and stay unavailable until each passes. If additional datasets cannot be verified within the hackathon timeline, prioritize one verified company rather than incomplete data.
- Historical inputs and market reference are sourced and dated. Growth, forecast margin, WACC, and terminal growth are editable, documented model assumptions, never represented as uniquely known market expectations.
- Revenue growth defaults to 5%, explicitly illustrative and editable. The -20% to 50% range is the solver-supported range only; it does not imply all values are reasonable for every company.
- Historical operating-margin baseline is the latest complete FY EBIT/revenue ratio, shown with its source and reporting date. The forecast-control range is 0%-70% and is validated separately. If the historical ratio falls outside it, the company remains eligible if all other data checks pass; show a clear out-of-range notice and require the user to select a valid forecast margin before affected calculations run. Never clip or silently substitute the historical value.
- WACC uses the documented CAPM method only when all inputs are traceable and date-compatible. The interest-expense / average-debt measure is a historical cost-of-debt proxy, not a current borrowing rate. If inputs cannot be verified, use 9.5% only as an illustrative, editable fallback, never as a calculated company-specific estimate.
- Terminal growth defaults to illustrative, editable 2%, within the proposed 0%-4% range, and must be at least 0.5 percentage points below WACC. The proposed WACC range of 5%-20% permits this gap; validate terminal growth against `min(4%, WACC - 0.5 percentage points)`.
- Every default records value, unit, rationale, source or calculation method, and classification as historical, estimated, or illustrative. Defaults are deterministic and editable.
- The EV bridge subtracts separately reported current short-term marketable securities when classification and amount are source-supported, in addition to cash and cash equivalents. It avoids double-counting holdings already included in cash and applies the same definition to reference EV and modeled equity value per share.
- Use basic shares as an explicitly simplified convention and label per-share output as an estimate.
- Build and validate one company's complete DCF, reverse solver, and equal-value chart before adding the other two. The 2-4-hour active-work window is a planning target, not a guarantee; core one-company milestone takes priority over full polish and tornado chart.

## What We're Building

- A single responsive company dashboard with dated sourced inputs, calculated reference EV, and clear assumption/output distinctions.
- Deterministic five-year FCFF/WACC model with validated input conventions and terminal-value contribution.
- Explicit Reverse DCF and Forward Valuation modes with the defined growth behavior and assumption continuity.
- Growth-versus-margin equal-value chart using the same DCF and solver, including explicit unavailable gaps.
- No-root, invalid-input, solver-failure, and unavailable-company states that preserve trustworthy context.
- One fully verified company end to end first; then Apple and NVIDIA only if their full data audits pass the same conventions. If verification cannot be completed in time, keep the release to the verified company.
- Source attribution and one-minute demo journey.

## Deferred From the POC

- Tornado chart until the primary DCF, reverse solver, equal-value chart, and additional company data are complete.
- Manual company entry and richer custom assumption sets.
- Saved scenarios, account system, and comparing prior company scenarios.
- Live market/financial-data feed and automatic refresh.

## Possible Later Enhancements

- Add more companies, geographies, currencies, and additional valuation methods after the three-company workflow is reliable.
- Add a plain-English AI explanation only after the core calculations are correct and verified; AI must never calculate or override valuation results.
- Add richer scenario comparison and sensitivity views after the one-company end-to-end journey is complete.

## Non-Goals

- Stock-price predictions or buy/sell recommendations; the product explains conditional assumptions, not future returns or investment suitability.
- Autonomous research agent or live API dependency; manually sourced dated inputs keep the MVP reviewable and reproducible.
- Uncalibrated Monte Carlo simulation; it would imply unsupported precision and is not needed to demonstrate the central idea.
- Tax-loss carryforward modeling, changing tax rates, or other tax adjustments; the MVP uses the stated fixed historical effective rate and discloses the simplification.
- Lease-liability EV adjustment; excluded consistently from the MVP convention.
- Chatbot-first presentation, global company coverage, or an expansive forecasting model.

## Remaining Review Items

- **Company eligibility prerequisite, before selection:** Microsoft must pass its full source and input audit. Apple and NVIDIA remain conditional candidates until each independently passes. Do not invent missing company-specific values. If these audits cannot be completed within the hackathon, narrow the initial selectable set to the verified company.
- **Can be resolved during specification:** Final layout behavior at narrow mobile widths while preserving the dashboard's stated information order; company-specific verified source values, dates, and resulting CAPM WACC values are established by the required data audit, not assumed by this PRD.
