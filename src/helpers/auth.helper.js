import { pbkdf2Sync, randomBytes } from "crypto";

const SALT_BYTES = 16;
const KEY_BYTES = 64;
const ITERATIONS = 310000;
const DIGEST = "sha256";

export function hashPassword(password = "") {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = pbkdf2Sync(password, salt, ITERATIONS, KEY_BYTES, DIGEST).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password = "", storedHash = "") {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) {
    return false;
  }
  const derivedKey = pbkdf2Sync(password, salt, ITERATIONS, KEY_BYTES, DIGEST).toString("hex");
  return derivedKey === key;
}
