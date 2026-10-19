import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionButton, ActionLink } from "./action";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./dialog";

describe("Pancis action semantics", () => {
  it("submits its associated form and blocks repeat submissions while saving", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const view = render(
      <>
        <form id="profile" onSubmit={submit} />
        <ActionButton family="save" type="submit" form="profile">
          Guardar cambios
        </ActionButton>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(submit).toHaveBeenCalledTimes(1);
    view.rerender(
      <>
        <form id="profile" onSubmit={submit} />
        <ActionButton family="save" type="submit" form="profile" loading>
          Guardar cambios
        </ActionButton>
      </>,
    );
    const button = screen.getByRole("button", { name: "Guardar cambios" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await user.click(button);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("forwards Radix trigger events and refs and restores keyboard focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <ActionButton family="add" compact aria-label="Crear alimento" />
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Nuevo alimento</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Crear alimento" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("keeps navigation as an anchor and ordinary actions out of form submission", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <ActionButton family="edit">Editar</ActionButton>
        <ActionLink family="add" href="/nutricion/dieta">
          Importar dieta
        </ActionLink>
      </form>,
    );
    expect(
      screen.getByRole("link", { name: "Importar dieta" }),
    ).toHaveAttribute("href", "/nutricion/dieta");
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(submit).not.toHaveBeenCalled();
  });
});
