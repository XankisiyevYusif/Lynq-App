import React from "react";

export default function EmployerAbout({ user }) {
  const basic = user?.basicInfo || {};
  const company = user?.companyInfo || {};
  const contact = user?.contactInfo || {};

  const companyName = company.name || basic.fullName || "Company";
  const overview = company.bio || user?.about?.bio || "";
  const website = company.website || contact.website || "";
  const phone = contact.phoneNumber || "";
  const industry = company.industry || "";
  const companySize = company.companySize || "";
  const headquarters = company.location || basic.location || "";
  const founded = company.foundedYear || "";
  const address = contact.address || headquarters || "";

  const normalizeWebsite = (url) => {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const mapQuery = address || headquarters || companyName;

  return (
    <div className="employer-about-wrapper" style={styles.wrapper}>
      <div className="employer-about-card" style={styles.card}>
        <h2 style={styles.title}>Overview</h2>

        <p style={styles.overview}>
          {overview || "Company overview has not been added yet."}
        </p>

        <InfoBlock title="Website">
          {website ? (
            <a
              href={normalizeWebsite(website)}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              {website}
            </a>
          ) : (
            <span style={styles.muted}>Not provided</span>
          )}
        </InfoBlock>

        <InfoBlock title="Phone">
          {phone ? (
            <a href={`tel:${phone}`} style={styles.link}>
              {phone}
            </a>
          ) : (
            <span style={styles.muted}>Not provided</span>
          )}
        </InfoBlock>

        <InfoBlock title="Industry">
          <span style={styles.text}>{industry || "Not provided"}</span>
        </InfoBlock>

        <InfoBlock title="Company size">
          <span style={styles.text}>{companySize || "Not provided"}</span>
        </InfoBlock>

        <InfoBlock title="Headquarters">
          <span style={styles.text}>{headquarters || "Not provided"}</span>
        </InfoBlock>

        <InfoBlock title="Founded">
          <span style={styles.text}>{founded || "Not provided"}</span>
        </InfoBlock>
      </div>

      <div className="employer-about-card" style={styles.card}>
        <h2 style={styles.title}>Locations</h2>

        <div style={styles.locationTop}>
          <div style={styles.locationName}>{companyName}</div>

          <div style={styles.address}>
            {address || "Physical location has not been added yet."}
          </div>

          {address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                address,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.directionLink}
            >
              Get directions ↗
            </a>
          )}
        </div>

        <div style={styles.mapBox}>
          {mapQuery ? (
            <iframe
              title="Company location map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapQuery,
              )}&output=embed`}
              style={styles.mapFrame}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div style={styles.emptyMap}>
              <div style={styles.pin}>📍</div>
              <div style={styles.mapText}>
                This organization has no physical location.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }) {
  return (
    <div className="employer-about-info" style={styles.infoBlock}>
      <div className="employer-about-info-title" style={styles.infoTitle}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: 820,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  card: {
    width: "100%",
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    padding: "22px",
    boxSizing: "border-box",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
  },

  title: {
    margin: 0,
    fontSize: 22,
    color: "var(--app-text)",
    fontWeight: 700,
  },

  overview: {
    marginTop: 14,
    color: "var(--app-muted)",
    lineHeight: 1.5,
    whiteSpace: "pre-line",
    fontSize: 14,
    fontWeight: 400,
  },

  infoBlock: {
    marginTop: 17,
  },

  infoTitle: {
    fontWeight: 600,
    color: "var(--app-text)",
    marginBottom: 3,
    fontSize: 14,
  },

  text: {
    color: "var(--app-muted)",
    fontSize: 14,
    fontWeight: 400,
  },

  muted: {
    color: "var(--app-muted)",
    fontSize: 14,
    fontWeight: 400,
  },

  link: {
    color: "#0a66c2",
    textDecoration: "none",
    fontWeight: 500,
    fontSize: 14,
  },

  locationTop: {
    marginTop: 16,
  },

  locationName: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--app-text-soft)",
  },

  address: {
    marginTop: 5,
    fontSize: 14,
    color: "var(--app-muted)",
    lineHeight: 1.4,
  },

  directionLink: {
    display: "inline-block",
    marginTop: 12,
    color: "#0a66c2",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  },

  mapBox: {
    margin: "24px -22px -22px",
    height: 300,
    borderTop: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface-2)",
    overflow: "hidden",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  mapFrame: {
    width: "100%",
    height: "100%",
    border: 0,
    display: "block",
  },

  emptyMap: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--app-muted)",
  },

  pin: {
    fontSize: 42,
    marginBottom: 10,
  },

  mapText: {
    fontSize: 14,
    color: "var(--app-muted)",
  },
};
