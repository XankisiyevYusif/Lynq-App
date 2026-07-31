export const MAX_CHAT_FILES = 5;
export const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_CHAT_TOTAL_SIZE = 25 * 1024 * 1024;

export const ALLOWED_CHAT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".zip",
];

export const CHAT_FILE_ACCEPT = ALLOWED_CHAT_EXTENSIONS.join(",");

export const getFileExtension = (fileName = "") => {
  const normalized = fileName.toLowerCase();
  const lastDotIndex = normalized.lastIndexOf(".");

  return lastDotIndex >= 0 ? normalized.slice(lastDotIndex) : "";
};

export const validateChatFiles = (files) => {
  const normalizedFiles = Array.from(files || []);

  if (normalizedFiles.length > MAX_CHAT_FILES) {
    return `You can send up to ${MAX_CHAT_FILES} files in one message.`;
  }

  let totalSize = 0;

  for (const file of normalizedFiles) {
    const extension = getFileExtension(file.name);

    if (!ALLOWED_CHAT_EXTENSIONS.includes(extension)) {
      return `This file type is not supported: ${file.name}`;
    }

    if (file.size > MAX_CHAT_FILE_SIZE) {
      return `${file.name} exceeds the 10 MB limit.`;
    }

    totalSize += file.size;
  }

  if (totalSize > MAX_CHAT_TOTAL_SIZE) {
    return "The total file size cannot exceed 25 MB.";
  }

  return "";
};

export const formatFileSize = (bytes) => {
  const value = Number(bytes) || 0;

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const normalizeChatAttachment = (attachment) => {
  if (!attachment || typeof attachment !== "object") return null;

  return {
    id: attachment.id ?? attachment.Id ?? null,
    url: attachment.url ?? attachment.Url ?? "",
    originalFileName:
      attachment.originalFileName ??
      attachment.OriginalFileName ??
      attachment.fileName ??
      attachment.FileName ??
      "File",
    contentType:
      attachment.contentType ??
      attachment.ContentType ??
      "application/octet-stream",
    sizeBytes: attachment.sizeBytes ?? attachment.SizeBytes ?? 0,
    type: attachment.type ?? attachment.Type ?? 3,
  };
};

export const getAttachmentKind = (attachment) => {
  const normalized = normalizeChatAttachment(attachment);

  if (!normalized) return "file";

  const numericType = Number(normalized.type);
  const stringType = String(normalized.type).toLowerCase();
  const contentType = String(normalized.contentType).toLowerCase();
  const extension = getFileExtension(normalized.originalFileName);

  if (
    numericType === 1 ||
    stringType === "image" ||
    contentType.startsWith("image/")
  ) {
    return "image";
  }

  if (
    numericType === 2 ||
    stringType === "pdf" ||
    contentType === "application/pdf" ||
    extension === ".pdf"
  ) {
    return "pdf";
  }

  return "file";
};

export const getAttachmentPreviewText = (attachments) => {
  const normalizedAttachments = Array.isArray(attachments)
    ? attachments.map(normalizeChatAttachment).filter(Boolean)
    : [];

  if (normalizedAttachments.length === 0) return "";

  if (normalizedAttachments.length > 1) {
    return `📎 ${normalizedAttachments.length} files`;
  }

  const kind = getAttachmentKind(normalizedAttachments[0]);

  if (kind === "image") return "📷 Image";
  if (kind === "pdf") return "📄 PDF";

  return "📎 File";
};
