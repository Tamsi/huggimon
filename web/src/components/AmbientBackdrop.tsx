type Props = {
  /** Cover the full viewport behind scrolling content (profile pages). */
  fixed?: boolean;
};

export function AmbientBackdrop({ fixed = false }: Props) {
  return (
    <div
      className={`hk-ambient-backdrop${fixed ? " hk-ambient-backdrop--fixed" : ""}`}
      aria-hidden
    >
      <span className="hk-ambient-backdrop__orb hk-ambient-backdrop__orb--blue" />
      <span className="hk-ambient-backdrop__orb hk-ambient-backdrop__orb--gold" />
    </div>
  );
}
