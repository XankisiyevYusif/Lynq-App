import React from "react";
import { useNavigate } from "react-router-dom";

const TOKEN_PATTERN = /(https?:\/\/[^\s<>"']+|[@#][\p{L}\p{N}._-]+)/giu;
const URL_PATTERN = /^https?:\/\//i;
const URL_TRAILING_PUNCTUATION = /[.,!?;:)\]}]+$/;

export default function RichPostContent({ content, className, style }) {
  const navigate = useNavigate();

  if (!content) return null;

  const parts = String(content).split(TOKEN_PATTERN);

  const openToken = (token) => {
    if (token.startsWith("@")) {
      navigate(`/profile/${token.slice(1)}`);
      return;
    }

    navigate(`/search?query=${encodeURIComponent(token)}`);
  };

  return (
    <div className={className} style={style}>
      {parts.map((part, index) => {
        if (URL_PATTERN.test(part)) {
          const trailing = part.match(URL_TRAILING_PUNCTUATION)?.[0] || "";
          const href = trailing ? part.slice(0, -trailing.length) : part;

          return (
            <React.Fragment key={`${part}-${index}`}>
              <a
                className="post-content-link"
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                onClick={(event) => event.stopPropagation()}
              >
                {href}
              </a>
              {trailing}
            </React.Fragment>
          );
        }

        const isToken = /^[@#][\p{L}\p{N}._-]+$/u.test(part);

        if (!isToken) {
          return (
            <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
          );
        }

        return (
          <button
            key={`${part}-${index}`}
            type="button"
            className="post-content-token"
            onClick={(event) => {
              event.stopPropagation();
              openToken(part);
            }}
          >
            {part}
          </button>
        );
      })}
    </div>
  );
}
