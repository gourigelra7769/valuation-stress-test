// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardClient } from "../../components/DashboardClient";
import { loadSelectableCompanies } from "../../src/domain/company-data";
import { calculateDcf } from "../../src/domain/dcf";
import { syntheticCompanyDataset, syntheticManifest, syntheticVerifiedEntry } from "../fixtures/company-dataset";

function company(options: Parameters<typeof syntheticCompanyDataset>[0] = {}) {
  const dataset = syntheticCompanyDataset(options);
  return loadSelectableCompanies(syntheticManifest([syntheticVerifiedEntry(dataset.company.id)]), {
    [`${dataset.company.id}.json`]: dataset,
  }).companies[0];
}

describe("dashboard integration", () => {
  afterEach(() => cleanup());
  it("shows the approved unavailable state and withholds placeholder metrics when there are no verified datasets", () => {
    render(<DashboardClient companies={[]} />);
    expect(screen.getByText("No company has passed the source audit yet")).toBeTruthy();
    expect(screen.getByText(/no company dataset is currently marked verified/i)).toBeTruthy();
    expect(screen.queryByTestId("reference-ev")).toBeNull();
    expect(screen.queryByRole("img", { name: /revenue growth required/i })).toBeNull();
    expect(screen.getByRole("link", { name: "Open the separate fictional educational demo" }).getAttribute("href")).toBe("/demo");
  });

  it("integrates reverse and forward modes, edits assumptions, and renders the generated chart", async () => {
    const { container } = render(<DashboardClient companies={[company()]} />);
    expect((screen.getByRole("spinbutton", { name: /Revenue growth/ }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByTestId("reference-ev").textContent).toContain("$1,005.0m");
    await waitFor(() => expect(screen.getByTestId("modeled-ev").textContent).not.toBe("Unavailable"));
    const forecastPanel = screen.getByTestId("forecast-panel");
    const reverseGrowth = screen.getByTestId("growth-result").textContent ?? "";
    const tableRegion = within(forecastPanel).getByRole("region", { name: "Scrollable five-year FCFF forecast table" });
    expect(tableRegion.getAttribute("tabindex")).toBe("0");
    const notes = within(forecastPanel).getByTestId("forecast-notes") as HTMLDetailsElement;
    expect(notes.open).toBe(false);
    fireEvent.click(within(forecastPanel).getByText("Inputs and calculation notes"));
    expect(notes.open).toBe(true);
    expect(notes.textContent).toContain(`Revenue growth: ${reverseGrowth} — solver-derived for this Reverse DCF result`);
    expect(notes.textContent).toContain("solver-derived for this Reverse DCF result");
    expect(notes.textContent).toContain("Taxes: EBIT × effective tax rate 20.00%");
    expect(notes.textContent).toContain("Year 1 compares with base-year revenue $1,000.0000m");
    for (const heading of ["Revenue and operating assumptions", "FCFF construction", "Discounting", "Terminal value and enterprise value"]) {
      expect(within(notes).getByRole("heading", { name: heading })).toBeTruthy();
    }
    expect(notes.querySelector('a[href="https://example.test/source"]')).toBeTruthy();
    expect(within(forecastPanel).getByText("Current model output is displayed in USD millions.")).toBeTruthy();
    for (let year = 1; year <= 5; year += 1) expect(within(forecastPanel).getByRole("columnheader", { name: `Year ${year}` })).toBeTruthy();
    expect(within(forecastPanel).getByRole("rowheader", { name: "Revenue" })).toBeTruthy();
    const revenueRow = within(forecastPanel).getByRole("rowheader", { name: "Revenue" }).closest("tr");
    expect(revenueRow?.querySelectorAll("td")).toHaveLength(5);
    expect(revenueRow?.querySelector("td")?.textContent).toMatch(/^\$[\d,.]+m$/);
    for (const label of ["EBIT", "Taxes", "D&A", "CapEx", "FCFF", "Discount factor"]) {
      expect(within(forecastPanel).getByRole("rowheader", { name: label })).toBeTruthy();
    }
    expect(within(forecastPanel).getByRole("rowheader", { name: "Change in operating net working capital" })).toBeTruthy();
    expect(within(forecastPanel).getByRole("rowheader", { name: "Present value of FCFF" })).toBeTruthy();
    expect(within(forecastPanel).getByTestId("forecast-pv-subtotal").textContent).toMatch(/^\$[\d,.]+m$/);
    expect(within(forecastPanel).getByTestId("forecast-terminal-value").textContent).toMatch(/^\$[\d,.]+m$/);
    expect(within(forecastPanel).getByTestId("forecast-pv-terminal").textContent).toMatch(/^\$[\d,.]+m$/);
    expect(within(forecastPanel).getByText("Undiscounted; reference only")).toBeTruthy();
    expect(within(forecastPanel).getByText("Modeled EV includes the present value of terminal value.")).toBeTruthy();
    expect(within(forecastPanel).getByText(/sum of the present values of the five forecast FCFFs plus the present value of terminal value/i)).toBeTruthy();
    expect(within(forecastPanel).getByText(/terminal value at year 5 is undiscounted and shown for reference; it is not added directly to this subtotal/i)).toBeTruthy();
    const displayedAmount = (testId: string) => Number(within(forecastPanel).getByTestId(testId).textContent?.replace(/[$,m]/g, ""));
    expect(displayedAmount("forecast-pv-subtotal") + displayedAmount("forecast-pv-terminal"))
      .toBeCloseTo(displayedAmount("forecast-modeled-ev"), 3);
    expect((screen.getByRole("spinbutton", { name: /Revenue growth/ }) as HTMLInputElement).value).toBe(reverseGrowth.replace("%", ""));
    expect(screen.getByRole("img", { name: /revenue growth required/i })).toBeTruthy();
    expect(container.querySelectorAll(".curve-point").length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole("button", { name: "Forward Valuation" }));
    const carriedPanel = screen.getByTestId("forecast-panel");
    fireEvent.click(within(carriedPanel).getByText("Inputs and calculation notes"));
    expect(within(carriedPanel).getByTestId("forecast-notes").textContent).toContain("solver-derived by Reverse DCF and carried into Forward Valuation");
    fireEvent.click(within(carriedPanel).getByText("Inputs and calculation notes"));
    const growth = screen.getByRole("spinbutton", { name: /Revenue growth/ }) as HTMLInputElement;
    fireEvent.change(growth, { target: { value: "8" } });
    expect(growth.value).toBe("8");
    expect(screen.getByTestId("growth-result").textContent).toBe("8.00%");
    expect(screen.getByTestId("modeled-ev").textContent).not.toBe("Unavailable");
    const forwardPanel = screen.getByTestId("forecast-panel");
    fireEvent.click(within(forwardPanel).getByText("Inputs and calculation notes"));
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("Revenue: base revenue $1,000.0000m × (1 + revenue growth 8.00%)");
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("Revenue growth: 8.00% — user-edited assumption");
    fireEvent.change(growth, { target: { value: "5" } });
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("Revenue growth: 5.00% — user-edited assumption");
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("Default reference: 5.00%");

    fireEvent.click(screen.getByRole("button", { name: "Reverse DCF" }));
    await waitFor(() => expect(screen.getByTestId("growth-result").textContent).not.toBe("8.00%"));
    expect(screen.getByTestId("reference-ev").textContent).toContain("$1,005.0m");
    expect(reverseGrowth).not.toBe("Unavailable");
  }, 15000);

  it("labels invalid assumptions and blocks modeled outputs without changing reference EV", () => {
    render(<DashboardClient companies={[company()]} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /WACC/ }), { target: { value: "4" } });
    expect(screen.getByRole("alert").textContent).toMatch(/invalid assumptions/i);
    expect(screen.getByTestId("modeled-ev").textContent).toBe("Unavailable");
    expect(screen.queryByTestId("forecast-panel")).toBeNull();
    expect(screen.getByTestId("reference-ev").textContent).toContain("$1,005.0m");
  });

  it("shows the confirmed no-root state separately from invalid inputs", () => {
    const base = company();
    const highTarget = { ...base, reference: { ...base.reference, referenceEv: 1_000_000 } };
    render(<DashboardClient companies={[highTarget]} />);
    expect(screen.getByRole("status").textContent).toMatch(/No valid growth solution/);
    expect(screen.getByTestId("modeled-ev").textContent).toBe("Unavailable");
    expect(screen.queryByTestId("forecast-panel")).toBeNull();
  });

  it("distinguishes a numerically inconclusive reverse solve from a confirmed no-root result", () => {
    const base = company();
    const atMaximumGrowth = calculateDcf({ ...base.modelInput, assumptions: { ...base.modelInput.assumptions, revenueGrowth: 0.5 } });
    if (atMaximumGrowth.status !== "valid") throw new Error("Expected valid synthetic boundary fixture.");
    const inconclusiveTarget = atMaximumGrowth.value.modeledEv * 1.00005;
    const inconclusive = { ...base, reference: { ...base.reference, referenceEv: inconclusiveTarget } };
    render(<DashboardClient companies={[inconclusive]} />);
    expect(screen.getByRole("alert").textContent).toMatch(/Numerical solver could not confirm/i);
    expect(screen.queryByText(/No valid growth solution/i)).toBeNull();
  }, 15000);

  it("keeps the reference bridge and sourced input context tied to the selected verified company", () => {
    const a = company({ id: "alpha", ticker: "ALP" });
    const b = company({ id: "beta", ticker: "BET", sharePrice: 120 });
    render(<DashboardClient companies={[a, b]} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Company" }), { target: { value: "beta" } });
    expect(screen.getByRole("status").textContent).toContain("Synthetic beta");
    expect(screen.getByText("Synthetic beta")).toBeTruthy();
    expect(screen.getByText("Reference EV bridge")).toBeTruthy();
    expect(within(screen.getByText("Source-backed company inputs").closest("section")!).getByText("120")).toBeTruthy();
  }, 15000);

  it("does not invent source links or missing assumption rationale and method", () => {
    const verifiedFixture = company();
    // Simulate absent records after fixture validation to exercise the UI's defensive provenance rendering.
    verifiedFixture.dataset.sources = [];
    verifiedFixture.dataset.defaults.wacc.method = "";
    verifiedFixture.dataset.defaults.wacc.rationale = "";
    render(<DashboardClient companies={[verifiedFixture]} />);
    fireEvent.click(screen.getByRole("button", { name: "Forward Valuation" }));
    fireEvent.change(screen.getByRole("spinbutton", { name: /WACC/ }), { target: { value: "11" } });
    const panel = screen.getByTestId("forecast-panel");
    fireEvent.click(within(panel).getByText("Inputs and calculation notes"));
    const notes = within(panel).getByTestId("forecast-notes");
    expect(notes.textContent).toContain("Default reference: 9.50%; its method (unavailable in the company record) and rationale (unavailable in the company record)");
    expect(notes.textContent).toContain("source link unavailable in the company record");
    expect(notes.querySelectorAll("a")).toHaveLength(0);
  }, 15000);
});
