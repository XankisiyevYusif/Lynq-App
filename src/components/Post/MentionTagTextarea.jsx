import React, { useEffect, useRef, useState } from "react";
import defaultAvatar from "../../assets/default-avatar.png";
import {
  getRecommendedUsers,
  searchHashtags,
  searchUsers,
} from "../../services/searchApi";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import "./Post.css";

const ACTIVE_TOKEN_PATTERN = /(?:^|\s)([@#])([\p{L}\p{N}._-]{0,40})$/u;

export default function MentionTagTextarea({
  value,
  onChange,
  onKeyDown,
  onSuggestionSelected,
  style,
  ...textareaProps
}) {
  const textareaRef = useRef(null);
  const requestIdRef = useRef(0);
  const [activeToken, setActiveToken] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const detectToken = (nextValue, caret) => {
    const beforeCaret = nextValue.slice(0, caret);
    const match = beforeCaret.match(ACTIVE_TOKEN_PATTERN);

    if (!match) {
      setActiveToken(null);
      setSuggestions([]);
      return;
    }

    setActiveToken({
      symbol: match[1],
      query: match[2],
      start: caret - match[1].length - match[2].length,
      end: caret,
    });
  };

  useEffect(() => {
    if (!activeToken) return undefined;

    const requestId = ++requestIdRef.current;
    const timer = window.setTimeout(async () => {
      const result =
        activeToken.symbol === "@"
          ? activeToken.query
            ? await searchUsers(activeToken.query).catch(() => [])
            : await getRecommendedUsers(1, 6).catch(() => [])
          : await searchHashtags(activeToken.query).catch(() => []);

      if (requestId !== requestIdRef.current) return;

      setSuggestions(result.slice(0, 6));
      setSelectedIndex(0);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [activeToken?.query, activeToken?.symbol]);

  const getUsername = (item) =>
    item?.username || item?.Username || item?.userName || item?.UserName || "";

  const getTag = (item) =>
    typeof item === "string"
      ? item.replace(/^#/, "")
      : (item?.name || item?.Name || item?.tag || item?.Tag || "").replace(
          /^#/,
          "",
        );

  const insertSuggestion = (item) => {
    if (!activeToken) return;

    const itemValue =
      activeToken.symbol === "@" ? getUsername(item) : getTag(item);
    if (!itemValue) return;

    const replacement = `${activeToken.symbol}${itemValue} `;
    const nextValue =
      value.slice(0, activeToken.start) +
      replacement +
      value.slice(activeToken.end);
    const nextCaret = activeToken.start + replacement.length;

    onChange(nextValue);
    onSuggestionSelected?.(item, activeToken.symbol);
    setActiveToken(null);
    setSuggestions([]);

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleKeyDown = (event) => {
    if (suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((current) => (current + 1) % suggestions.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex(
          (current) => (current - 1 + suggestions.length) % suggestions.length,
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        insertSuggestion(suggestions[selectedIndex]);
        return;
      }

      if (event.key === "Escape") {
        setSuggestions([]);
        setActiveToken(null);
        return;
      }
    }

    onKeyDown?.(event);
  };

  return (
    <div className="mention-textarea-wrap">
      <textarea
        {...textareaProps}
        ref={textareaRef}
        value={value}
        style={style}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          detectToken(nextValue, event.target.selectionStart);
        }}
        onClick={(event) =>
          detectToken(
            event.currentTarget.value,
            event.currentTarget.selectionStart,
          )
        }
        onKeyDown={handleKeyDown}
      />

      {activeToken && suggestions.length > 0 && (
        <div className="mention-suggestions" role="listbox">
          {suggestions.map((item, index) => {
            const username = getUsername(item);
            const tag = getTag(item);
            const isMention = activeToken.symbol === "@";
            const label = isMention
              ? item?.fullName || item?.FullName || item?.name || username
              : `#${tag}`;

            return (
              <button
                key={isMention ? username : tag}
                type="button"
                className={`mention-suggestion-item ${
                  index === selectedIndex ? "is-selected" : ""
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertSuggestion(item)}
              >
                {isMention ? (
                  <img
                    src={resolveMediaUrl(
                      item?.profileImage || item?.ProfileImage,
                      defaultAvatar,
                    )}
                    alt=""
                  />
                ) : (
                  <span className="mention-hash-icon">#</span>
                )}
                <span>
                  <strong>{label}</strong>
                  <small>
                    {isMention
                      ? `@${username}`
                      : `${item?.postCount || item?.PostCount || 0} posts`}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
