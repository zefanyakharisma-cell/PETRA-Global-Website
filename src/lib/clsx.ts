/** Tiny classnames joiner — avoids a dep for the common falsy-filter case. */
export function clsx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(' ');
}
