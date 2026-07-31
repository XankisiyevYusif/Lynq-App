import { API_ROOT } from "../services/api";

const MEDIA_KEYS = [
  "secureUrl",
  "SecureUrl",
  "secure_url",
  "url",
  "Url",
  "path",
  "Path",
  "imageUrl",
  "ImageUrl",
  "videoUrl",
  "VideoUrl",
  "profileImage",
  "ProfileImage",
  "backgroundImage",
  "BackgroundImage",
  "logoUrl",
  "LogoUrl",
  "companyLogo",
  "CompanyLogo",
  "userPhoto",
  "UserPhoto",
  "photoUrl",
  "PhotoUrl",
];

export const extractMediaPath = (value) => {
  if (typeof value === "string") return value;

  if (!value || typeof value !== "object") return "";

  for (const key of MEDIA_KEYS) {
    const candidate = value[key];

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return "";
};

export const resolveMediaUrl = (value, fallback = "") => {
  const rawPath = extractMediaPath(value);
  let cleanPath = rawPath.trim().replace(/\\/g, "/");

  if (!cleanPath) return fallback;

  if (/^(https?:\/\/|blob:|data:)/i.test(cleanPath)) {
    return cleanPath;
  }

  if (cleanPath.startsWith("//")) {
    return `https:${cleanPath}`;
  }

  const wwwrootIndex = cleanPath.toLowerCase().lastIndexOf("/wwwroot/");
  if (wwwrootIndex >= 0) {
    cleanPath = cleanPath.slice(wwwrootIndex + "/wwwroot/".length);
  } else {
    cleanPath = cleanPath.replace(/^wwwroot\//i, "");
  }

  return `${API_ROOT}/${cleanPath.replace(/^\/+/, "")}`;
};
