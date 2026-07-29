import { gcm } from "@noble/ciphers/aes.js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from "@noble/hashes/utils.js";

const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

const textDecoder = new TextDecoder();

export type PasswordVerifier = {
  salt: string;
  hash: string;
  iterations: number;
};

export type EncryptedBlob = {
  format: "kumapulse.backup";
  version: 1;
  kdf: "pbkdf2-sha256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  return pbkdf2Async(
    sha256,
    utf8ToBytes(password),
    salt,
    { c: iterations, dkLen: KEY_LENGTH },
  );
}

export async function createPasswordVerifier(
  password: string,
): Promise<PasswordVerifier> {
  const salt = randomBytes(SALT_LENGTH);
  const hash = await deriveKey(
    password,
    salt,
    PBKDF2_ITERATIONS,
  );

  return {
    salt: bytesToHex(salt),
    hash: bytesToHex(hash),
    iterations: PBKDF2_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  verifier: PasswordVerifier,
): Promise<boolean> {
  const derived = await deriveKey(
    password,
    hexToBytes(verifier.salt),
    verifier.iterations,
  );

  const expected = hexToBytes(verifier.hash);

  if (derived.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < derived.length; i += 1) {
    mismatch |= derived[i]! ^ expected[i]!;
  }

  return mismatch === 0;
}

export async function encryptUtf8(
  plaintext: string,
  password: string,
): Promise<EncryptedBlob> {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(
    password,
    salt,
    PBKDF2_ITERATIONS,
  );
  const aes = gcm(key, iv);
  const ciphertext = aes.encrypt(
    utf8ToBytes(plaintext),
  );

  return {
    format: "kumapulse.backup",
    version: 1,
    kdf: "pbkdf2-sha256",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    ciphertext: bytesToHex(ciphertext),
  };
}

export async function decryptUtf8(
  blob: EncryptedBlob,
  password: string,
): Promise<string> {
  if (
    blob.format !== "kumapulse.backup" ||
    blob.version !== 1 ||
    blob.kdf !== "pbkdf2-sha256"
  ) {
    throw new Error("Formato de backup no válido");
  }

  const key = await deriveKey(
    password,
    hexToBytes(blob.salt),
    blob.iterations,
  );
  const aes = gcm(key, hexToBytes(blob.iv));
  const plaintext = aes.decrypt(
    hexToBytes(blob.ciphertext),
  );

  return textDecoder.decode(plaintext);
}

export function isEncryptedBlob(
  value: unknown,
): value is EncryptedBlob {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate = value as Record<
    string,
    unknown
  >;

  return (
    candidate.format === "kumapulse.backup" &&
    candidate.version === 1 &&
    candidate.kdf === "pbkdf2-sha256" &&
    typeof candidate.iterations === "number" &&
    typeof candidate.salt === "string" &&
    typeof candidate.iv === "string" &&
    typeof candidate.ciphertext === "string"
  );
}
