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
    const growth = screen.getByRole("spinbutton", { name: "Revenue growth" }) as HTMLInputElement;
    expect(growth.disabled).toBe(false);
    fireEvent.change(growth, { target: { value: "12" } });
    expect(growth.value).toBe("12");
    expect(screen.getByTestId("demo-growth").textContent).toBe("12.00%");
    expect(screen.getByTestId("demo-modeled-ev").textContent).not.toBe("Unavailable");

    fireEvent.click(screen.getByRole("button", { name: "Reverse DCF" }));
    await waitFor(() => expect(screen.getByTestId("demo-growth").textContent).not.toBe("12.00%"));
    expect(screen.getByRole("note", { name: "Fictional educational data warning" }).textContent).toBe(FICTIONAL_DEMO_WARNING);
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
