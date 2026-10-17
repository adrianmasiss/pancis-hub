"use client";

/**
 * Papelera con tapa que se abre al pasar por encima (diseño del usuario). En
 * el día no borra nada del plan: marca el alimento como no consumido en esta
 * fecha, y la fila ofrece restaurarlo.
 */
export function OmitFoodButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="omit-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <svg
        className="omit-button-icon omit-button-lid"
        viewBox="0 0 69 14"
        fill="none"
        aria-hidden="true"
      >
        <path d="M20.8232 2.62734L19.9948 4.21304C19.8224 4.54309 19.4808 4.75 19.1085 4.75H4.92857C2.20246 4.75 0 6.87266 0 9.5C0 12.1273 2.20246 14.25 4.92857 14.25H64.0714C66.7975 14.25 69 12.1273 69 9.5C69 6.87266 66.7975 4.75 64.0714 4.75H49.8915C49.5192 4.75 49.1776 4.54309 49.0052 4.21305L48.1768 2.62734C47.3451 1.00938 45.6355 0 43.7719 0H25.2281C23.3645 0 21.6549 1.00938 20.8232 2.62734Z" />
      </svg>
      <svg
        className="omit-button-icon"
        viewBox="0 0 69 57"
        fill="none"
        aria-hidden="true"
      >
        <path d="M64.0023 1.0648C64.0397 0.4882 63.5822 0 63.0044 0H5.99556C5.4178 0 4.96025 0.4882 4.99766 1.0648L8.19375 50.3203C8.44018 54.0758 11.6746 57 15.5712 57H53.4288C57.3254 57 60.5598 54.0758 60.8062 50.3203L64.0023 1.0648Z" />
      </svg>
    </button>
  );
}
