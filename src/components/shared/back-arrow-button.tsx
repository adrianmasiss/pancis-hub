const ARROW = "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z";

/**
 * Circle "back" button: on hover the ring shrinks away, a brand ring scales
 * in and a second arrow slides in after the first. Styles live with the
 * comparison board (`.back-arrow-button`).
 */
export function BackArrowButton({
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
      className="back-arrow-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="back-arrow-box" aria-hidden="true">
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 24 24" className="back-arrow-elem">
            <path d={ARROW} />
          </svg>
        ))}
      </span>
    </button>
  );
}
