export function Logo() {
  return (
    <span className="logo" aria-label="Start QAI Shop">
      <span className="logo__kick">
        {"START".split("").map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
      <span className="logo__mark">
        <span className="logo__qa">Q</span>
        <span className="logo__divider" aria-hidden="true" />
        <span className="logo__qa">A</span>
        <span className="logo__i">I</span>
      </span>
      <span className="logo__shop">
        {"SHOP".split("").map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </span>
    </span>
  );
}
