import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { PasskeySettings } from "./passkey-settings";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  register: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      registerPasskey: mocks.register,
      passkey: { list: mocks.list, delete: mocks.remove },
    },
  }),
}));
const key = {
  id: "key-id",
  friendly_name: "Mi teléfono",
  created_at: "2026-09-23T00:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("isSecureContext", true);
  vi.stubGlobal("PublicKeyCredential", class {});
  vi.stubGlobal("navigator", {
    credentials: { get: vi.fn(), create: vi.fn() },
  });
  mocks.list.mockResolvedValue({ data: [], error: null });
});
afterEach(() => vi.unstubAllGlobals());
it("shows registration success only after server verification", async () => {
  mocks.register.mockResolvedValue({ data: key, error: null });
  render(<PasskeySettings />);
  const add = await screen.findByRole("button", {
    name: "Agregar llave de acceso",
  });
  await waitFor(() => expect(add).toBeEnabled());
  fireEvent.click(add);
  expect(await screen.findByText("Mi teléfono")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("registrada");
});
it("requires confirmation to revoke a key and removes it after success", async () => {
  mocks.list.mockResolvedValue({ data: [key], error: null });
  mocks.remove.mockResolvedValue({ error: null });
  render(<PasskeySettings />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Eliminar Mi teléfono" }),
  );
  expect(mocks.remove).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Eliminar" }),
  );
  await waitFor(() =>
    expect(mocks.remove).toHaveBeenCalledWith({ passkeyId: "key-id" }),
  );
  await waitFor(() =>
    expect(screen.queryByText("Mi teléfono")).not.toBeInTheDocument(),
  );
});
it("retains a key when revocation fails", async () => {
  mocks.list.mockResolvedValue({ data: [key], error: null });
  mocks.remove.mockResolvedValue({ error: { message: "internal failure" } });
  render(<PasskeySettings />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Eliminar Mi teléfono" }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Eliminar" }),
  );
  await screen.findByRole("alert");
  expect(screen.getByText("Mi teléfono")).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
