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
    const reverseGrowth = screen.getByTestId("growth-result").textContent ?? "";
    expect((screen.getByRole("spinbutton", { name: /Revenue growth/ }) as HTMLInputElement).value).toBe(reverseGrowth.replace("%", ""));
    expect(screen.getByRole("img", { name: /revenue growth required/i })).toBeTruthy();
    expect(container.querySelectorAll(".curve-point").length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole("button", { name: "Forward Valuation" }));
    const growth = screen.getByRole("spinbutton", { name: /Revenue growth/ }) as HTMLInputElement;
    fireEvent.change(growth, { target: { value: "8" } });
    expect(growth.value).toBe("8");
    expect(screen.getByTestId("growth-result").textContent).toBe("8.00%");
    expect(screen.getByTestId("modeled-ev").textContent).not.toBe("Unavailable");

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
    expect(screen.getByTestId("reference-ev").textContent).toContain("$1,005.0m");
  });

  it("shows the confirmed no-root state separately from invalid inputs", () => {
    const base = company();
    const highTarget = { ...base, reference: { ...base.reference, referenceEv: 1_000_000 } };
    render(<DashboardClient companies={[highTarget]} />);
    expect(screen.getByRole("status").textContent).toMatch(/No valid growth solution/);
    expect(screen.getByTestId("modeled-ev").textContent).toBe("Unavailable");
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
  });
});
