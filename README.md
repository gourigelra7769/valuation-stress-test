# Valuation Stress-Test Engine

Valuation Stress-Test Engine helps users understand the revenue growth expectations implied by an enterprise valuation and how the result changes when key assumptions change.

## What it does

The project includes a five-year FCFF/WACC discounted cash flow model, a Reverse DCF solver that finds revenue growth matching a fixed reference enterprise value, and a Forward Valuation mode that calculates enterprise value from user-selected growth. Editable assumptions include revenue growth, forecast operating margin, WACC, and terminal growth. A growth-versus-margin sensitivity chart solves against the same fixed target at different forecast margins and shows unavailable regions as gaps.

The company dashboard at `/` is currently in its unavailable state: no company dataset has passed the source audit. The separate `/demo` route exercises the model using fictional educational inputs.

> **Educational data only:** The current demo uses fictional educational data. It is not real market data and is not a verified company valuation.

The verified-company eligibility gate remains separate and intact. A company becomes selectable only after its dataset and source audit pass validation. The fictional demo is not a company dataset and cannot pass or satisfy that gate.

## Run locally

Requires Node.js 20.9 or later and npm. Install the dependencies declared in `package.json` and start the Next.js development server:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The unavailable company dashboard is at `/`; the fictional educational demo is at `/demo`.

The app uses Next.js, React, and React DOM. Its tests use Vitest and React Testing Library; no separate chart package is required for the SVG chart.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

These run the test suite, TypeScript type check, and Next.js production build, respectively.

## Links

- Deployed app: <https://valuation-stress-test-eimn.vercel.app>
- GitHub repository: <https://github.com/gourigelra7769/valuation-stress-test>
