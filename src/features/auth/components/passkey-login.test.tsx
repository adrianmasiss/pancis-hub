import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { PasskeyLogin } from "./passkey-login";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signInWithPasskey: mocks.signIn } }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("PublicKeyCredential", class {});
  vi.stubGlobal("navigator", {
    credentials: { get: vi.fn(), create: vi.fn() },
  });
});
afterEach(() => vi.unstubAllGlobals());

it("navigates only after receiving a verified session", async () => {
  mocks.signIn.mockResolvedValue({ data: { session: {} }, error: null });
  render(
    <PasskeyLogin next="/nutricion" disabled={false} onBusyChange={vi.fn()} />,
  );
  fireEvent.click(await screen.findByRole("button"));
  await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/nutricion"));
  expect(mocks.refresh).toHaveBeenCalled();
});
it("keeps password fallback available on cancellation without navigating", async () => {
  mocks.signIn.mockResolvedValue({
    data: null,
    error: { name: "NotAllowedError" },
  });
  const busy = vi.fn();
  render(<PasskeyLogin next="/" disabled={false} onBusyChange={busy} />);
  fireEvent.click(await screen.findByRole("button"));
  expect(await screen.findByRole("alert")).toHaveTextContent("contraseña");
  expect(mocks.replace).not.toHaveBeenCalled();
  expect(busy).toHaveBeenLastCalledWith(false);
});
it("does not accept an empty successful response as authentication", async () => {
  mocks.signIn.mockResolvedValue({ data: { session: null }, error: null });
  render(<PasskeyLogin next="/" disabled={false} onBusyChange={vi.fn()} />);
  fireEvent.click(await screen.findByRole("button"));
  await screen.findByRole("alert");
  expect(mocks.replace).not.toHaveBeenCalled();
});
it("hides the option on unsupported browsers", () => {
  vi.stubGlobal("PublicKeyCredential", undefined);
  render(<PasskeyLogin next="/" disabled={false} onBusyChange={vi.fn()} />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
