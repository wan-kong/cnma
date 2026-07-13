import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse the time to string
 * @param {(object | string | number)} time
 * @param {string} cFormat
 * @returns {string | null}
 */
export function parseTime(time: string | number | Date | undefined | null, cFormat?: string) {
  if (!time) return null;
  const format = cFormat || "{y}-{m}-{d} {h}:{i}:{s}";
  let date: Date;
  if (time instanceof Date) {
    date = time;
  } else {
    if (typeof time === "string" && /^\d+$/.test(time)) time = Number.parseInt(time, 10);
    if (typeof time === "number" && time.toString().length >= 10 && time.toString().length < 13)
      time = time * 1000;
    date = new Date(time);
  }
  const formatObj = new Map();
  formatObj.set("y", date.getFullYear());
  formatObj.set("m", date.getMonth() + 1);
  formatObj.set("d", date.getDate());
  formatObj.set("h", date.getHours());
  formatObj.set("i", date.getMinutes());
  formatObj.set("s", date.getSeconds());
  formatObj.set("a", date.getDay());
  formatObj.set("l", date.getMilliseconds());
  const time_str = format.replace(/\{([ymdhisal])+\}/g, (_result, key) => {
    const value = formatObj.get(key);
    // Note: getDay() returns 0 on Sunday
    if (key === "a") return ["日", "一", "二", "三", "四", "五", "六"][value];

    return value.toString().padStart(2, "0");
  });
  return time_str;
}
