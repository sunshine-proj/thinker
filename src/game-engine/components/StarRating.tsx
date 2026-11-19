/** Stars shown as symbols and as text, so colour is never the only signal. */
export function StarRating({ stars, max, label = "stars" }: { readonly stars: number; readonly max: number; readonly label?: string }) {
  return (
    <span aria-label={`${stars} of ${max} ${label}`} className="star-rating" role="img">
      <span aria-hidden="true">
        {"★".repeat(stars)}
        <span className="star-rating__empty">{"☆".repeat(Math.max(0, max - stars))}</span>
      </span>
    </span>
  );
}
