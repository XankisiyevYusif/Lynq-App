export const decodeJwtPayload = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((character) =>
          `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`,
        )
        .join(""),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decode failed:", error);
    return null;
  }
};

export const getTokenRole = (token) => {
  const payload = decodeJwtPayload(token);
  const role =
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload?.role ||
    payload?.roles;

  return Array.isArray(role) ? role[0] : role || null;
};

export const isStaffRole = (role) =>
  role === "Admin" || role === "Moderator";

export const createUserFromToken = (token) => {
  const payload = decodeJwtPayload(token) || {};
  const role = getTokenRole(token);
  const username =
    payload.unique_name || payload.username || payload.preferred_username || "";

  return {
    id:
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] || payload.sub || "",
    username,
    fullName: payload.name || username,
    email:
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      ] || payload.email || "",
    role,
    userType: isStaffRole(role) ? "Staff" : role,
    portal: payload.portal || (isStaffRole(role) ? "staff" : "platform"),
  };
};
