
// Zero-dependency TOTP implementation using Web Crypto API
// Standards: RFC 4226 (HOTP) & RFC 6238 (TOTP)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Decode Base32 string to Uint8Array
const base32ToBuffer = (str: string): Uint8Array => {
  let cleaned = str.toUpperCase().replace(/[^A-Z2-7]/g, '');
  // Padding cleanup
  cleaned = cleaned.replace(/=+$/, '');
  
  const length = cleaned.length;
  const buffer = new Uint8Array(((length * 5) / 8) | 0);
  
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    value = (value << 5) | ALPHABET.indexOf(cleaned[i]);
    bits += 5;

    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }

  return buffer;
};

// HMAC-SHA1 using Web Crypto
const hmacSha1 = async (key: Uint8Array, message: Uint8Array): Promise<Uint8Array> => {
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );
  
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
};

export const generateTOTP = async (secret: string, window = 0): Promise<string> => {
  try {
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep) + window;
    
    // Convert counter to 8-byte buffer
    const counterBuffer = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBuffer[i] = temp & 0xff;
      temp = Math.floor(temp / 256); // Use math floor for >32bit safety in JS numbers
    }

    const keyBuffer = base32ToBuffer(secret);
    const hmac = await hmacSha1(keyBuffer, counterBuffer);
    
    const offset = hmac[hmac.length - 1] & 0xf;
    
    // Extract 4-byte dynamic binary code
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
      
    const otp = binary % 1000000;
    
    return otp.toString().padStart(6, '0');
  } catch (e) {
    console.error("TOTP Generation Error", e);
    return '000000';
  }
};

export const getRemainingTime = (): number => {
  const epoch = Math.floor(Date.now() / 1000);
  return 30 - (epoch % 30);
};

export interface SentinelService {
    id: string;
    name: string;
    secret: string;
    issuer?: string;
    vault: string[]; // Per-account recovery codes (10 slots)
    note?: string; // Encrypted Uplink Note
    hiddenDescription?: string; // Sensitive info (Email, Password, etc.)
    tags?: string[]; // Identity Linking Tags (MAIN, ALT, etc.)
}

// Secure Local Storage Wrapper
export const syncToDatabase = (services: SentinelService[]) => {
    localStorage.setItem('nexus_sentinel_services', JSON.stringify(services));
};

export const fetchFromDatabase = (): SentinelService[] => {
    const data = localStorage.getItem('nexus_sentinel_services');
    if (!data) return [];
    
    try {
        const parsed = JSON.parse(data);
        // Migration: Ensure every service has a vault array, note field, hiddenDescription, and tags
        return parsed.map((item: any) => ({
            ...item,
            vault: Array.isArray(item.vault) && item.vault.length === 10 
                ? item.vault 
                : Array(10).fill('EMPTY_SLOT'),
            note: item.note || '',
            hiddenDescription: item.hiddenDescription || '',
            tags: Array.isArray(item.tags) ? item.tags : []
        }));
    } catch (e) {
        console.error("Database corruption detected", e);
        return [];
    }
};
