import { useEffect, useMemo, useState } from "react";
import debounce from "lodash.debounce";

/**
 * Returns a value only after it has remained unchanged for the delay period.
 * Useful for search inputs that should update immediately without issuing an
 * API request for every keystroke.
 */
export default function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  const updateDebouncedValue = useMemo(
    () => debounce((nextValue) => setDebouncedValue(nextValue), delay),
    [delay],
  );

  useEffect(() => {
    updateDebouncedValue(value);

    return () => updateDebouncedValue.cancel();
  }, [updateDebouncedValue, value]);

  return debouncedValue;
}
