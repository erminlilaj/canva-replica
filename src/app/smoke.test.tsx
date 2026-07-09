// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("idb-keyval", () => {
  const store = new Map<string, unknown>();
  return {
    get: async (key: string) => store.get(key),
    set: async (key: string, value: unknown) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
  };
});

afterEach(() => {
  cleanup();
});

describe("App smoke test", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders the gallery and opens the editor from the risk template card", async () => {
    const { default: App } = await import("./App");
    const { sq } = await import("../i18n/sq");
    render(<App />);

    expect(await screen.findByText(sq.gallery.title)).toBeTruthy();
    const startButton = await screen.findByText(sq.gallery.startRisk);

    fireEvent.click(startButton);

    expect(await screen.findByLabelText(sq.canvas.page)).toBeTruthy();
  });
});
