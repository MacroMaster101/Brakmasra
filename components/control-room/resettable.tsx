"use client";
import { Fragment, useState, type ReactNode } from "react";
/** Reset only this section, using the latest saved server values. */
export function Resettable({ children }: { children: (reset: () => void) => ReactNode }) {
  const [version, setVersion] = useState(0);
  return <Fragment key={version}>{children(() => setVersion(value => value + 1))}</Fragment>;
}
