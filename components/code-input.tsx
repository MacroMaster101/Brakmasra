"use client";

import { useRef, useState, useSyncExternalStore, type ClipboardEvent, type KeyboardEvent } from "react";

import { ClipboardPaste } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { RESET_CODE_LENGTH } from "@/lib/reset-code";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

const noSubscription = () => () => {};
/** Clipboard reading exists only in the browser, so the server renders without the button. */
function useCanReadClipboard() {
  return useSyncExternalStore(noSubscription, () => typeof navigator.clipboard?.readText === "function", () => false);
}

/** One box per digit; typing, pasting, and phone autofill all fill it in order. */
export function CodeInput({ name, disabled }: { name: string; disabled: boolean }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState<string[]>(() => Array(RESET_CODE_LENGTH).fill(""));
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const canPaste = useCanReadClipboard();

  const fillFrom = (start: number, value: string) => {
    const incoming = digitsOnly(value).slice(0, RESET_CODE_LENGTH - start);
    if (!incoming) return;
    setDigits((current) => {
      const next = [...current];
      incoming.split("").forEach((digit, offset) => { next[start + offset] = digit; });
      return next;
    });
    boxes.current[Math.min(start + incoming.length, RESET_CODE_LENGTH - 1)]?.focus();
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigits((current) => current.map((digit, i) => (i === index - 1 ? "" : digit)));
      boxes.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      boxes.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < RESET_CODE_LENGTH - 1) {
      boxes.current[index + 1]?.focus();
    }
  };

  const onPaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    fillFrom(index, event.clipboardData.getData("text"));
  };

  const pasteFromClipboard = async () => {
    try {
      // The browser asks the visitor's permission; a refusal simply does nothing.
      fillFrom(0, await navigator.clipboard.readText());
    } catch {
      boxes.current[0]?.focus();
    }
  };

  return (
    <fieldset className="code-input" disabled={disabled}>
      <legend>{t.resetCodeLabel}</legend>
      <div>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => { boxes.current[index] = element; }}
            value={digit}
            onChange={(event) => {
              const value = digitsOnly(event.target.value);
              if (value.length > 1) fillFrom(index, value);
              else {
                setDigits((current) => current.map((d, i) => (i === index ? value : d)));
                if (value && index < RESET_CODE_LENGTH - 1) boxes.current[index + 1]?.focus();
              }
            }}
            onKeyDown={(event) => onKeyDown(index, event)}
            onPaste={(event) => onPaste(index, event)}
            onFocus={(event) => event.target.select()}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={t.resetCodeDigit(index + 1, RESET_CODE_LENGTH)}
            autoFocus={index === 0}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={digits.join("")} />
      {canPaste && (
        <button className="code-paste" type="button" onClick={pasteFromClipboard}>
          <ClipboardPaste aria-hidden="true" />
          {t.resetPasteCode}
        </button>
      )}
    </fieldset>
  );
}
