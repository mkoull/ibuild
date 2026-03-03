import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../../security/crypto.js";

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("crypto", () => {
  it("encrypts and decrypts a string roundtrip", () => {
    const plaintext = "Hello, iBuild!";
    const encrypted = encrypt(plaintext, TEST_KEY);
    expect(encrypted).not.toEqual(plaintext);
    expect(encrypted.split(":")).toHaveLength(3);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("handles JSON data roundtrip", () => {
    const data = JSON.stringify({ project: "Test", amount: 42000 });
    const encrypted = encrypt(data, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(JSON.parse(decrypted)).toEqual({ project: "Test", amount: 42000 });
  });

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const plaintext = "same input";
    const a = encrypt(plaintext, TEST_KEY);
    const b = encrypt(plaintext, TEST_KEY);
    expect(a).not.toBe(b);
    expect(decrypt(a, TEST_KEY)).toBe(plaintext);
    expect(decrypt(b, TEST_KEY)).toBe(plaintext);
  });

  it("detects tampered ciphertext", () => {
    const encrypted = encrypt("sensitive", TEST_KEY);
    const parts = encrypted.split(":");
    // Tamper with ciphertext
    const tampered = parts[0] + ":" + parts[1] + ":AAAA" + parts[2].slice(4);
    expect(() => decrypt(tampered, TEST_KEY)).toThrow();
  });

  it("rejects short encryption key", () => {
    expect(() => encrypt("test", "tooshort")).toThrow("ENCRYPTION_KEY must be a 64-char hex string");
  });

  it("rejects invalid format", () => {
    expect(() => decrypt("not:valid:format:extra", TEST_KEY)).toThrow();
  });

  it("handles empty string", () => {
    const encrypted = encrypt("", TEST_KEY);
    expect(decrypt(encrypted, TEST_KEY)).toBe("");
  });

  it("handles unicode characters", () => {
    const text = "Price: $50,000 — includes GST ✓";
    const encrypted = encrypt(text, TEST_KEY);
    expect(decrypt(encrypted, TEST_KEY)).toBe(text);
  });
});
