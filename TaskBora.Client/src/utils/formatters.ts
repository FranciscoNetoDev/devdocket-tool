import { PRIORITY_LABELS, STATUS_LABELS } from "@/constants/taskConstants";

export const getPriorityLabel = (priority: string): string => {
  return PRIORITY_LABELS[priority] || priority;
};

export const getStatusLabel = (status: string): string => {
  return STATUS_LABELS[status] || status;
};

export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const getUserInitials = (
  nickname: string | null,
  fullName: string | null,
  email: string | null
): string => {
  if (nickname) {
    return nickname
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (fullName) {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() || "U";
};

export const getFileIcon = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
    return "image";
  }
  if (["pdf"].includes(ext || "")) {
    return "pdf";
  }
  return "file";
};

export const isImageFile = (fileName: string): boolean => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
};
