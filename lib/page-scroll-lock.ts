/** Keep the document width and offset stable while a mobile overlay owns scrolling. */
export function lockPageScroll() {
  const root = document.documentElement;
  const previousOverflow = root.style.overflow;
  const previousPadding = document.body.style.paddingRight;
  const gutter = Math.max(0, window.innerWidth - root.clientWidth);
  if (gutter) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + gutter}px`;
  root.style.overflow = "hidden";
  return () => {
    root.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPadding;
  };
}
