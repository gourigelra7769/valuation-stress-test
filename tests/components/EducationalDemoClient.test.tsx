// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EducationalDemoClient } from "../../components/EducationalDemoClient";
import { FICTIONAL_DEMO_WARNING } from "../../src/demo/fictional-scenario";

describe("educational demo dashboard", () => {
  afterEach(() => cleanup());

  it("keeps the fictional warning visible and uses the shared reverse, forward, and chart calculations", async () => {
    const { container } = render(<EducationalDemoClient />);
    expect(screen.getByRole("note", { name: "Fictional educational data warning" }).textContent).toBe(FICTIONAL_DEMO_WARNING);
    expect(screen.getByText("Fictional scenario · no issuer or quote")).toBeTruthy();
    expect(screen.getByText("Invented baseline values used only for this educational calculation")).toBeTruthy();
    expect(screen.getByText("User-selected assumptions")).toBeTruthy();
    expect(screen.getAllByText("Calculated outputs").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/calculated fictional target EV/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/match the reference EV/i)).toBeNull();
    expect(screen.queryByText(/verified company|source-backed company|market share price/i)).toBeNull();
    expect(screen.getByRole("img", { name: /revenue growth required/i })).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("demo-modeled-ev").textContent).not.toBe("Unavailable"));
    const forecastPanel = screen.getByTestId("forecast-panel");
    expect(within(forecastPanel).getByRole("region", { name: "Scrollable five-year FCFF forecast table" }).getAttribute("tabindex")).toBe("0");
    const initialNotes = within(forecastPanel).getByTestId("forecast-notes") as HTMLDetailsElement;
    expect(initialNotes.open).toBe(false);
    fireEvent.click(within(forecastPanel).getByText("Inputs and calculation notes"));
    expect(initialNotes.open).toBe(true);
    expect(initialNotes.textContent).toContain("Fictional educational inputs only — not real company data");
    expect(initialNotes.textContent).toContain("fictional baseline assumption (editable by the user)");
    expect(initialNotes.textContent).toContain("Revenue: base revenue $1,000.0000m × (1 + revenue growth 8.00%)");
    expect(initialNotes.textContent).toContain("real source provenance and effective dates are unavailable");
    expect(within(initialNotes).getByRole("heading", { name: "FCFF construction" })).toBeTruthy();
    expect(within(forecastPanel).getByText("Modeled EV includes the present value of terminal value.")).toBeTruthy();
    expect(initialNotes.querySelectorAll("a")).toHaveLength(0);
    for (let year = 1; year <= 5; year += 1) expect(within(forecastPanel).getByRole("columnheader", { name: `Year ${year}` })).toBeTruthy();
    expect(within(forecastPanel).getByRole("rowheader", { name: "Revenue" })).toBeTruthy();
    expect(within(forecastPanel).getByRole("rowheader", { name: "FCFF" })).toBeTruthy();
    expect(within(forecastPanel).getByRole("rowheader", { name: "Discount factor" })).toBeTruthy();
    for (const testId of ["forecast-pv-subtotal", "forecast-terminal-value", "forecast-pv-terminal", "forecast-modeled-ev"]) {
      expect(within(forecastPanel).getByTestId(testId).textContent).toMatch(/^\$[\d,.]+m$/);
    }
    expect(screen.getByRole("note", { name: "Fictional educational data warning" }).textContent).toBe(FICTIONAL_DEMO_WARNING);
    expect(screen.getAllByText("Fictional inputs").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".curve-point").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Forward Valuation" }));
    const carriedPanel = screen.getByTestId("forecast-panel");
    fireEvent.click(within(carriedPanel).getByText("Inputs and calculation notes"));
    expect(within(carriedPanel).getByTestId("forecast-notes").textContent).toContain("solver-derived by Reverse DCF and carried into Forward Valuation");
    fireEvent.click(within(carriedPanel).getByText("Inputs and calculation notes"));
    const growth = screen.getByRole("spinbutton", { name: "Revenue growth" }) as HTMLInputElement;
    expect(growth.disabled).toBe(false);
    fireEvent.change(growth, { target: { value: "12" } });
    expect(growth.value).toBe("12");
    expect(screen.getByTestId("demo-growth").textContent).toBe("12.00%");
    expect(screen.getByTestId("demo-modeled-ev").textContent).not.toBe("Unavailable");
    const forwardPanel = screen.getByTestId("forecast-panel");
    fireEvent.click(within(forwardPanel).getByText("Inputs and calculation notes"));
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("revenue growth 12.00%");
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("Fictional educational inputs only");
    expect(within(forwardPanel).getByTestId("forecast-notes").textContent).toContain("Revenue growth: 12.00% — fictional, user-selected assumption");

    fireEvent.click(screen.getByRole("button", { name: "Reverse DCF" }));
    await waitFor(() => expect(screen.getByTestId("demo-growth").textContent).not.toBe("12.00%"));
    expect(screen.getByRole("note", { name: "Fictional educational data warning" }).textContent).toBe(FICTIONAL_DEMO_WARNING);
    const reversePanel = screen.getByTestId("forecast-panel");
    fireEvent.click(within(reversePanel).getByText("Inputs and calculation notes"));
    expect(within(reversePanel).getByTestId("forecast-notes").textContent).toContain(`Revenue growth: ${screen.getByTestId("demo-growth").textContent} — solver-derived`);
  }, 20000);

  it("blocks calculated output for invalid assumptions while retaining the fictional target", () => {
    render(<EducationalDemoClient />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "WACC" }), { target: { value: "4" } });
    expect(screen.getByRole("alert").textContent).toMatch(/invalid assumptions/i);
    expect(screen.getByTestId("demo-modeled-ev").textContent).toBe("Unavailable");
    expect(screen.queryByTestId("forecast-panel")).toBeNull();
    expect(screen.getByTestId("demo-target").textContent).not.toBe("Unavailable");
  });

  it("shows numerical solver failure without inventing a growth rate", async () => {
    render(<EducationalDemoClient />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Forecast operating margin" }), { target: { value: "0" } });
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/numerical solver could not confirm/i));
    expect(screen.getByTestId("demo-growth").textContent).toBe("Unavailable");
    expect(screen.getByTestId("demo-modeled-ev").textContent).toBe("Unavailable");
    expect(screen.queryByTestId("forecast-panel")).toBeNull();
    expect(screen.getByTestId("demo-target").textContent).not.toBe("Unavailable");
  }, 15000);
});
