import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";

export default function ProfileLookupInput({
  type,
  value,
  onChange,
  onSelect,
  placeholder,
  allowCustom = true,
  customLabel = "Use",
  maxLength = 150,
  inputStyle,
  onKeyDown,
  minSearchLength = 2,
}) {
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestIdRef = useRef(0);
  const pageSize = 10;

  const cleanValue = value?.trim() || "";
  const hasExactMatch = useMemo(
    () =>
      options.some(
        (option) => option.name?.toLowerCase() === cleanValue.toLowerCase(),
      ),
    [options, cleanValue],
  );

  useEffect(() => {
    if (!open || cleanValue.length < minSearchLength) {
      setOptions([]);
      setHasMore(false);
      return undefined;
    }

    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.get("/User/profile-options", {
          params: { type, query: cleanValue, page, pageSize },
          signal: controller.signal,
        });

        const payload = response?.data?.data || response?.data || {};
        const nextOptions = Array.isArray(payload)
          ? payload
          : payload?.items || payload?.Items || [];

        if (requestId === requestIdRef.current) {
          setOptions((current) =>
            page === 1 ? nextOptions : [...current, ...nextOptions],
          );
          setHasMore(
            typeof payload?.hasMore === "boolean"
              ? payload.hasMore
              : nextOptions.length === pageSize,
          );
        }
      } catch (error) {
        if (error?.code !== "ERR_CANCELED") {
          console.error(`Failed to load ${type} options:`, error);
          if (requestId === requestIdRef.current) {
            setOptions([]);
            setHasMore(false);
          }
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [type, cleanValue, open, minSearchLength, page]);

  const choose = (name, option = null) => {
    onChange(name);
    onSelect?.(name, option);
    setOpen(false);
  };

  return (
    <div style={styles.root}>
      <input
        style={{ ...styles.input, ...inputStyle }}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(cleanValue.length >= minSearchLength)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          setPage(1);
          setOptions([]);
          setOpen(nextValue.trim().length >= minSearchLength);
        }}
        onKeyDown={onKeyDown}
      />

      {open && cleanValue.length >= minSearchLength && (
        <div style={styles.menu}>
          {loading && page === 1 && (
            <div style={styles.status}>Searching...</div>
          )}

          {options.map((option) => (
            <button
              key={option.id || `${type}-${option.name}`}
              type="button"
              style={styles.option}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option.name, option)}
            >
              {option.name}
            </button>
          ))}

          {!loading && hasMore && (
            <button
              type="button"
              style={styles.loadMore}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setPage((current) => current + 1)}
            >
              Load more
            </button>
          )}

          {loading && page > 1 && (
            <div style={styles.status}>Loading more...</div>
          )}

          {!loading && allowCustom && cleanValue && !hasExactMatch && (
            <button
              type="button"
              style={{ ...styles.option, ...styles.customOption }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(cleanValue)}
            >
              {customLabel} &quot;{cleanValue}&quot;
            </button>
          )}

          {!loading &&
            options.length === 0 &&
            (!allowCustom || !cleanValue) && (
              <div style={styles.status}>No options found.</div>
            )}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { position: "relative", width: "100%" },
  input: {
    width: "100%",
    minHeight: 40,
    boxSizing: "border-box",
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    right: 0,
    maxHeight: 230,
    overflowY: "auto",
    backgroundColor: "var(--app-surface)",
    border: "1px solid #d8dde3",
    borderRadius: 10,
    boxShadow: "0 10px 26px rgba(0,0,0,0.14)",
    zIndex: 100,
  },
  option: {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text)",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 14,
  },
  customOption: { color: "#0a66c2", fontWeight: 600 },
  loadMore: {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    border: "none",
    backgroundColor: "#f4f8fc",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
  },
  status: { padding: "10px 12px", color: "var(--app-muted)", fontSize: 13 },
};
