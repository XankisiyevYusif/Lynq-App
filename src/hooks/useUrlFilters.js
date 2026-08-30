import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps page-level filters in the address bar. Empty/default values are
 * removed so URLs stay readable, while unrelated query parameters survive.
 */
export default function useUrlFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = {};
    Object.entries(defaults).forEach(([key, fallback]) => {
      result[key] = searchParams.get(key) ?? fallback;
    });
    return result;
  }, [defaults, searchParams]);

  const update = useCallback((patch, options = {}) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      const changes = typeof patch === "function" ? patch(values) : patch;

      Object.entries(changes).forEach(([key, value]) => {
        const normalized = value == null ? "" : String(value).trim();
        if (!normalized || normalized === String(defaults[key] ?? "")) {
          next.delete(key);
        } else {
          next.set(key, normalized);
        }
      });

      return next;
    }, { replace: options.replace ?? true });
  }, [defaults, setSearchParams, values]);

  return [values, update];
}
