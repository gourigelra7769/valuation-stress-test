---
doc: scope
status: approved
---

# Valuation Stress-Test Engine

A focused equity-research tool that reverse-engineers the assumptions behind a dated market valuation and lets users see how sensitive that valuation is to changing assumptions.

## The Unique Kernel

The app makes valuation conditionality visible: one market-implied enterprise value can be supported by different revenue-growth and operating-margin combinations, and changing assumptions reveals how demanding or fragile those paths are. A deterministic reverse DCF and an interactive growth-versus-margin chart make that lesson tangible without predicting a stock price.

## Who It's For

Finance students, aspiring equity analysts, beginner investors, and student investment-club members who want to understand what a company's valuation assumes. The initial data set is limited to three US-listed, non-financial companies; the interface should use clear units and explain terms so the experience can later support a broader audience.

## The Core Loop

1. Select one of three researched companies and see its dated reference share price, market-implied enterprise value, source-backed financial inputs, and model assumptions. The first completed build supports one company end to end; the other two are added only after that path is verified.
2. Run a reverse DCF to solve for the constant annual revenue growth rate that makes the model's enterprise value match the market-implied enterprise value, with the remaining assumptions held fixed.
3. Change an assumption such as WACC or operating margin and immediately compare the implied growth requirement or modeled enterprise value with the reference case.
4. Explore a growth-versus-operating-margin chart that traces combinations yielding approximately the same target enterprise value. Each point is conditional on the displayed fixed assumptions.

The memorable outcome is seeing several plausible-looking paths meet the same valuation target, while recognizing that the paths rely on different assumptions.

If no researched company passes the source and eligibility checks by submission time, the project may offer a separate educational demo route using only fictional, deterministic inputs. The verified-company selector and unavailable state remain unchanged. The demo is not a company dataset and must never be listed as verified or treated as market data.

## Inspiration & Identity

An interactive equity research terminal: polished, professional, analytical, and intuitive, with restrained colors, strong typography, clear financial units, well-labeled charts, and concise explanations. Sourced data, user-selected assumptions, and calculated outputs must be visually distinct. Avoid chatbot-first presentation and avoid implying estimates are facts.

## Why This Matters to the Learner

The learner wants to build a technically credible finance project that teaches how valuation depends on assumptions, while learning to plan before implementation. The deterministic model and visual analysis should demonstrate programming, numerical methods, financial modeling, and data visualization.

## What "Working" Looks Like

In a one-minute demo, a reviewer selects a supported company, sees the valuation date, cited inputs, and market-implied enterprise value; runs the reverse DCF and sees the implied revenue-growth requirement; changes one key assumption and sees the result update; then explores alternative growth-and-margin combinations on the chart. The reviewer can understand that a market valuation is not a forecast or certainty: it is conditional on assumptions.

## The POC Boundary

- Target Microsoft as the first end-to-end candidate, with Apple and NVIDIA as conditional additional candidates, using manually researched fixed data snapshots; no live financial-data API is required. No candidate becomes selectable until its full dataset passes the same completeness, source-attribution, date-consistency, and input-validation checks. Build and verify one company end to end first; only then add additional verified companies through the same input schema and model. If additional datasets cannot be verified within the hackathon timeline, prioritize a release with one fully verified company over incomplete data. Each candidate must have a market-price valuation date and traceable source citations for its share price, share count, balance-sheet figures, and historical operating inputs. Balance-sheet inputs use the latest publicly reported period available on or before the market-price valuation date; display both dates when they differ.
- Separate fallback demo: when no company is verified, expose an optional `/demo` educational route built from an isolated fictional scenario. It uses the same DCF engine, reverse solver, controls, and chart series, but has no issuer name, ticker, real quote, source-verification claim, or manifest entry. Keep the main company route unavailable and label the demo persistently **FICTIONAL EDUCATIONAL EXAMPLE — NOT REAL MARKET DATA**. Distinguish fictional inputs, user-selected assumptions, and calculated outputs. This route does not weaken or bypass the real-company gate.
- Use one annual, five-year FCFF/WACC convention for all companies. The base year is the latest complete fiscal year with source-backed inputs. Inputs include base-year revenue, EBIT, historical effective tax rate, D&A, capital expenditure, operating net working capital, basic common shares outstanding, dated share price, cash and cash equivalents, and interest-bearing debt. Define historical effective tax rate as reported income tax expense divided by reported pre-tax income for that base fiscal year. It is supported only when pre-tax income is positive and the resulting rate is between 0% and 40%, inclusive; if not, do not clamp or silently substitute a rateâ€”select another eligible company/base year or explicitly resolve and document it before inclusion. Derive base operating margin as EBIT/revenue, D&A/revenue and CapEx/revenue ratios, and operating NWC/revenue. For forecast years 1-5: revenue[t] = revenue[t-1] * (1 + constant user-selected annual growth); EBIT[t] = revenue[t] * user-selected constant operating margin; taxes[t] = EBIT[t] * fixed base-year historical effective tax rate; D&A[t] = revenue[t] * fixed base-year D&A/revenue; CapEx[t] = revenue[t] * fixed base-year CapEx/revenue; and change in NWC[t] = fixed base-year operating NWC/revenue * (revenue[t] - revenue[t-1]). This fixed-rate tax treatment is a simplification: it applies the historical rate directly to forecast EBIT and excludes tax-loss carryforwards, changing tax rates, and other tax adjustments. The initial company set must have positive base EBIT. Define operating NWC consistently as operating current assets less operating current liabilities, excluding cash and interest-bearing debt. FCFF[t] = EBIT[t] - taxes[t] + D&A[t] - CapEx[t] - change in NWC[t]. Discount each year-end FCFF at WACC. Terminal value at year 5 = FCFF[5] * (1 + terminal growth) / (WACC - terminal growth), with terminal growth strictly below WACC; discount it to the valuation date and add it to the present value of forecast FCFF. Show terminal value's share of modeled EV.
- Define market-implied enterprise value as a derived reference: closing share price on the displayed market-price valuation date * basic common shares outstanding from the latest publicly reported filing available on or before that date + current and long-term interest-bearing debt + reported preferred equity + reported non-controlling interest - cash and cash equivalents - separately reported short-term marketable securities classified as current assets when the source supports the classification and amount. Define cash as reported cash and cash equivalents, and do not double-count marketable securities already included there. Use the same definition in the modeled equity-value-per-share bridge: (modeled EV - debt - preferred equity - non-controlling interest + cash and cash equivalents + eligible current short-term marketable securities) / basic common shares. Using basic shares is a simplified modeling choice; label per-share output as an estimate that may differ from valuations using diluted shares or other market-data conventions. Include each adjustment when reported; if a company has an adjustment that cannot be sourced consistently, choose another candidate or disclose the exclusion and its effect. Do not include long-term investments or lease liabilities in the MVP bridge. Show each adjustment's reporting date and source; do not imply that a derived EV is itself a quoted market datum.
- The reverse solver uses the same FCFF engine as forward valuation and solves for the constant annual revenue growth that matches the fixed reference EV, keeping operating margin, tax, D&A/revenue, CapEx/revenue, NWC/revenue, WACC, terminal growth, and EV adjustments fixed. The equal-value chart is defined precisely: for each supported operating-margin value on its displayed margin range, solve for the revenue-growth value that matches the same fixed target EV, holding all other assumptions fixed. Use the identical tested DCF calculation and solver for every point. Mark a margin with no valid root in the supported growth range as unavailable; never draw an interpolated or fabricated solution across it. The chart displays target EV, current assumption point, axis units/ranges, and unavailable regions.
- Keep all calculations deterministic and independently testable. A repeated calculation with identical inputs must return identical outputs. Reverse solve must report when no solution exists within the displayed supported growth range. Block invalid inputs (including WACC <= terminal growth, non-positive basic share count, negative revenue, negative D&A or CapEx, non-finite values, or forecast margins outside the supported range) with a plain explanation. NWC can be positive or negative; derive and attribute it from the defined operating current assets and liabilities rather than rejecting negative NWC. Missing or inconsistent source inputs must not be silently filled or mixed across dates: exclude that company from the supported set until resolved, or disclose and reconcile a defensible value before it enters the snapshot.
- Minimum visual interaction: a clearly marked reference valuation and assumptions; controls for at least revenue growth, operating margin, and WACC; immediate display of modeled EV, implied growth (where applicable), equity value per share, and terminal-value contribution; and the defined growth-versus-margin equal-value chart. Core build sequence is: (1) implement the shared DCF calculation and verify one company end to end; (2) implement and verify reverse solving; (3) implement and verify the equal-value chart using that same calculation and solver; (4) add and verify the other two company data sets; (5) complete visual polish. The tornado chart is deferred until these steps are complete and is included only if time remains.
- Show source links beside or in a compact data-attribution view, the valuation date, units/currency, and which values are sourced, assumed, or calculated. State that the output is a simplified model, not a prediction or investment recommendation.
- Treat 2-4 hours as an active-work planning target, not a guarantee that a fully polished deliverable will be completed. The primary acceptance milestone is one company's end-to-end model, reverse solver, and equal-value chart meeting their acceptance criteria. Add the other two companies and visual polish after that milestone; if time is constrained, defer the secondary tornado chart and optional manual-company entry.

## Acceptance Criteria

- **DCF engine:** With a fixed, documented fixture, independently calculated annual revenue, EBIT, taxes, D&A, CapEx, change in NWC, FCFF, present value, terminal value, EV, and equity value per share agree within 0.01% (or display-rounding tolerance for per-share output). The same inputs produce identical outputs on repeated runs. Terminal value contribution is calculated and displayed as terminal value present value / modeled EV.
- **Reverse solver:** For a target EV produced by a known valid growth assumption, the solver recovers growth within 0.01 percentage points and the resulting EV matches target within 0.01%. A target outside the supported growth range returns an explicit no-solution state, not a clamped value.
- **Equal-value chart:** Every plotted margin point is computed by the same DCF engine and reverse solver against one fixed target EV. For each available point, reevaluating the DCF at its plotted growth and margin matches target EV within 0.1%. No-root points are visibly marked unavailable and are not connected through as if valid. Changing WACC or another fixed assumption recalculates the curve and target consistently.
- **Input validation:** Reject or explain each invalid class before displaying a valuation: WACC <= terminal growth, zero/negative share count, negative revenue, non-finite values, unsupported rates/ratios, and missing required source inputs. A source-data date mismatch is shown explicitly; the app never silently substitutes or combines values without attribution.
- **Source attribution:** Every sourced company input has a clickable citation, reported/as-of date, and unit. The market-price valuation date is visible. Calculated market cap and EV show their formula inputs and dates; assumptions are labeled separately from sourced inputs and model outputs. All three supported companies pass the same completeness and consistency check before being selectable.
- **Educational fallback:** If no real company passes, the main route remains in its unavailable state and `/demo` offers the separate fictional example. The warning stays visible while scrolling; no fictional value enters the company manifest or appears as sourced/verified.
- **Build order:** The first company completes the full reference-to-reverse-solve-to-equal-value-chart journey and meets the DCF, solver, chart, validation, and attribution criteria before the second and third companies are added. Tornado chart is not a prerequisite.

## Later

- Additional companies, geographies, currencies, and refreshed/live financial data.
- Manual company assumption entry and richer assumption editing.
- Tornado sensitivity chart, after the main interaction is complete.
- Plain-English AI explanation, only after core calculations are correct and verified; AI never calculates or overrides valuation results.
- More sophisticated forecasting, additional valuation methods, and expanded model conventions.

## Explicitly Cut

- Stock-price predictions and buy/sell recommendations: the project explains assumptions, not future price direction or investment suitability.
- Autonomous research agent or live API dependency: manual dated research keeps the source set reviewable and the demo reliable within the deadline.
- Uncalibrated Monte Carlo simulation: probabilistic output would imply precision without defensible calibration and is unnecessary to demonstrate the core idea.
- Multiple financial model variants or global coverage in the initial version: they add conventions and data complexity before the central lesson is proven.
- Any synthetic scenario presented as an actual issuer, real quote, verified company, or member of the source-backed company selector.

