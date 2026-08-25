import { useEffect, useRef, useState } from "react";

/**
 * A number input that stays genuinely blank while the user is editing it.
 * A plain controlled <input type="number" value={n}> snaps back to "0" on every
 * keystroke that clears the field, because the numeric value immediately re-renders
 * as "0" before the user can type a new number. This keeps its own text buffer and
 * only reconciles with the numeric `value` prop when the field isn't focused.
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  ...rest
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max">) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  function clamp(n: number): number {
    let result = n;
    if (min !== undefined) result = Math.max(min, result);
    if (max !== undefined) result = Math.min(max, result);
    return result;
  }

  return (
    <input
      {...rest}
      type="number"
      min={min}
      max={max}
      value={text}
      onFocus={(e) => {
        focused.current = true;
        rest.onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw !== "" && !Number.isNaN(Number(raw))) {
          onChange(clamp(Number(raw)));
        }
      }}
      onBlur={(e) => {
        focused.current = false;
        const n = clamp(text === "" ? (min ?? 0) : Number(text));
        setText(String(n));
        onChange(n);
        rest.onBlur?.(e);
      }}
    />
  );
}
