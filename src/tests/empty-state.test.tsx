import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/shared/empty-state";

describe("EmptyState", () => {
  it("muestra titulo y descripcion", () => {
    render(
      <EmptyState
        title="Sin datos"
        description="Aun no hay registros para mostrar."
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Sin datos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aun no hay registros para mostrar."),
    ).toBeInTheDocument();
  });
});
