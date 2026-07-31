import React from "react";
import { useNavigate } from "react-router-dom";

const TOKEN_PATTERN = /([@#][\p{L}\p{N}._-]+)/gu;

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
