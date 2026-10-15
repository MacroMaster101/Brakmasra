"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type PreferenceOption = {
  value: string;
  label: string;
  flag?: string;
  description?: string;
};

export function PreferenceMenu({
  label,
  value,
  options,
  onChange,
  placement = "down",
  icon,
  className = "",
}: {
  label: string;
  value: string;
  options: readonly PreferenceOption[];
  onChange: (value: string) => void;
  placement?: "down" | "up";
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const selectedIndex = Math.max(
    0,
    options.findIndex((item) => item.value === value),
  );
  const selected = options[selectedIndex];
  useLayoutEffect(() => {
    if (!open || !trigger.current || !popup.current) return;
    const position = () => {
      if (!trigger.current || !popup.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      const width = popup.current.offsetWidth;
      const edge = 16;
      const desiredLeft = anchor.right - width;
      const availableRight =
        document.documentElement.clientWidth - width - edge;
      const safeLeft = Math.max(edge, Math.min(desiredLeft, availableRight));
      container.current?.style.setProperty(
        "--preference-offset-x",
        `${safeLeft - desiredLeft}px`,
      );
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(trigger.current);
    observer.observe(popup.current);
    window.addEventListener("resize", position);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
    };
  }, [open, selectedIndex]);
  useEffect(() => {
    if (!trigger.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const width =
        entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      container.current?.style.setProperty(
        "--preference-trigger-width",
        `${width}px`,
      );
    });
    observer.observe(trigger.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    buttons.current[selectedIndex]?.focus();
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, selectedIndex]);
  return (
    <div
      ref={container}
      className={`preference-menu preference-${placement} ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className="preference-trigger"
        type="button"
        aria-label={`${label}: ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
        }}
      >
        {icon}
        {selected.flag && (
          <Image src={selected.flag} alt="" width={20} height={15} />
        )}
        <span>{selected.label}</span>
        <ChevronDown className="preference-chevron" aria-hidden="true" />
      </button>
      <div
        ref={popup}
        id={id}
        className="preference-popup"
        role="menu"
        aria-label={label}
        data-open={open}
        inert={!open}
        onKeyDown={(event) => {
          const index = buttons.current.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            buttons.current[
              (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
                options.length
            ]?.focus();
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            buttons.current[
              event.key === "Home" ? 0 : options.length - 1
            ]?.focus();
          } else if (event.key === "Escape" || event.key === "Tab") {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
            }
            setOpen(false);
            trigger.current?.focus();
          }
        }}
      >
        {options.map((item, index) => (
          <button
            ref={(element) => {
              buttons.current[index] = element;
            }}
            key={item.value}
            type="button"
            role="menuitemradio"
            aria-checked={item.value === value}
            aria-label={
              item.description
                ? `${item.label} — ${item.description}`
                : item.label
            }
            onClick={() => {
              onChange(item.value);
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            {item.flag && (
              <Image src={item.flag} alt="" width={20} height={15} />
            )}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
