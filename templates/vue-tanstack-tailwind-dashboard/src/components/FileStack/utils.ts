export function formatSize(size: number | string | null | undefined) {
  if (typeof size === "string") return size.trim();
  if (typeof size !== "number" || !Number.isFinite(size) || size < 0) return "";
  if (size === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  const precision = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[index]}`;
}

export const extensionToneMap: Record<string, string> = {
  DOC: "bg-blue-500 text-white",
  DOCX: "bg-blue-500 text-white",
  PDF: "bg-red-500 text-white",
  PPT: "bg-orange-500 text-white",
  PPTX: "bg-orange-500 text-white",
  XLS: "bg-emerald-500 text-white",
  XLSX: "bg-emerald-500 text-white",
  CSV: "bg-teal-500 text-white",
  TXT: "bg-slate-500 text-white",
  ZIP: "bg-amber-500 text-white",
  RAR: "bg-amber-500 text-white",
};

export function getExtension(name: string, type?: string | null) {
  const explicitType = type?.trim();
  if (explicitType) return explicitType.replace(/^\./, "").toUpperCase();

  const extension = name.match(/\.([^./\\\s]+)(?:\s|$)/)?.[1];
  return extension?.toUpperCase() || "FILE";
}

export function getToneClass(extension: string) {
  return extensionToneMap[extension] ?? "bg-muted text-muted-foreground ring-1 ring-border/70";
}
