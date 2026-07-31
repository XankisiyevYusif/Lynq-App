import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import defaultAvatar from "../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function OrganizationLookupInput({
  value,
  onChange,
  onSelect,
  placeholder,
  inputStyle,
  errorStyle,
  purpose = "experience",
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
        const response = await api.get("/User/organizations", {
          params: { query: cleanValue, purpose, page, pageSize },
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
          console.error("Failed to load organizations:", error);
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
  }, [cleanValue, open, minSearchLength, page, purpose]);

  return (
    <div style={styles.root}>
      <input
        style={{ ...styles.input, ...inputStyle, ...errorStyle }}
        value={value}
        maxLength={150}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(cleanValue.length >= minSearchLength)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          onSelect?.(null);
          setPage(1);
          setOptions([]);
          setOpen(nextValue.trim().length >= minSearchLength);
        }}
      />

      {open && cleanValue.length >= minSearchLength && (
        <div style={styles.menu}>
          {loading && page === 1 && (
            <div style={styles.status}>Searching...</div>
          )}

          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              style={styles.option}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.name);
                onSelect?.(option);
                setOpen(false);
              }}
            >
              <img
                src={resolveMediaUrl(option.logoUrl, defaultAvatar)}
                alt=""
                style={styles.logo}
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar;
                }}
              />
              <span style={styles.optionText}>
                <strong>{option.name}</strong>
                <small>{option.industry || "Organization profile"}</small>
              </span>
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

          {!loading && options.length === 0 && (
            <div style={styles.status}>
              No matching profile. Your custom name will use the default icon.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { position: "relative", width: "100%" },
  input: { width: "100%", minHeight: 40, boxSizing: "border-box" },
  menu: {
    position: "absolute",
    top: "calc(100% + 5px)",
    left: 0,
    right: 0,
    maxHeight: 250,
    overflowY: "auto",
    backgroundColor: "var(--app-surface)",
    border: "1px solid #d8dde3",
    borderRadius: 10,
    boxShadow: "0 10px 26px rgba(0,0,0,0.14)",
    zIndex: 100,
  },
  option: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    border: "none",
    borderBottom: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    textAlign: "left",
    cursor: "pointer",
  },
  logo: { width: 38, height: 38, borderRadius: 8, objectFit: "cover" },
  optionText: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    color: "var(--app-text)",
  },
  loadMore: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    backgroundColor: "#f4f8fc",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
  },
  status: { padding: "11px 12px", color: "var(--app-muted)", fontSize: 13 },
};
