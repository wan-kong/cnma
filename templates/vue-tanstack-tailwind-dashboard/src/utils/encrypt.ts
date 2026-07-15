// 登录表单加密：与后端约定的 XOR + Base64(UTF-8) 方案，与参考项目保持一致。
// ⚠️ KEY 与算法均与后端解密逻辑严格对应，请勿改动，否则后端无法解密登录数据。

// 固定密钥：hex 串按字节解码得到的字符串（等价参考项目 HexUtil(hex, false)）。
const KEY = hexToString("7d69454b344b716d47506c2d353134363f31277b686f335e59");

function hexToString(hex: string): string {
  const clean = hex.trim().replace(/\s+/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

// UTF-8 → Base64，等价于参考项目使用的 js-base64 `Base64.encode`。
function base64Encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Base64 → UTF-8。
function base64Decode(b64: string): string {
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// 逐字符与 KEY 循环异或（自反，加解密同一函数）。
function xorCipher(input: string, key: string): string {
  let result = "";
  for (let i = 0; i < input.length; i++) {
    result += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/** 加密：若为对象需先 `JSON.stringify` 再传入。 */
export function encrypt(str: string): string {
  return base64Encode(xorCipher(str, KEY));
}

/** 解密（与 encrypt 互逆，主要用于调试）。 */
export function decrypt(enStr: string): string {
  return xorCipher(base64Decode(enStr), KEY);
}
