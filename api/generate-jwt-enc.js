import { SignJWT, importPKCS8 } from "jose";
import { privateDecrypt, createDecipheriv, constants } from 'crypto';
import dotenv from 'dotenv';
// Load environment variables (for the private key)
dotenv.config();
export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin (or specify specific origins)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific HTTP methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers
    // Handle the preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(204).end(); // End with a 204 (No Content) status for preflight
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ message: "Only POST requests are allowed" });
        return;
    }
    const { keyID, issuerID, encryptedAESKey, iv, encryptedPrivateKey } = req.body;
    if (!keyID || !issuerID || !encryptedAESKey || !iv || !encryptedPrivateKey) {
        res.status(400).json({ message: "Missing keyID, issuerID, or encrypted data" });
        return;
    }
    try {
        // Decrypt the AES key using the server's private RSA key
        const base64PrivateKey = process.env.SERVER_PRIVATE_KEY;
        const serverPrivateKey = Buffer.from(base64PrivateKey || '', 'base64').toString('utf-8');
        if (!serverPrivateKey) {
            throw new Error("Private key is not available in environment variables.");
        }
        const aesKey = privateDecrypt({
            key: serverPrivateKey,
            padding: constants.RSA_PKCS1_OAEP_PADDING,
        }, Buffer.from(encryptedAESKey, 'base64')).toString();
        // Decrypt the private key using the decrypted AES key and the IV
        const decipher = createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'base64'), Buffer.from(iv, 'hex')); // Use the correct IV
        let decryptedPrivateKey = decipher.update(Buffer.from(encryptedPrivateKey, 'base64'));
        decryptedPrivateKey = Buffer.concat([decryptedPrivateKey, decipher.final()]);
        // Convert the decrypted private key buffer to a string
        let privateKeyPEM = decryptedPrivateKey.toString('utf-8').trim();
        privateKeyPEM = privateKeyPEM.replace(/\\n/g, '\n');
        // Ensure the private key is in proper PEM format
        if (!privateKeyPEM.includes('BEGIN PRIVATE KEY')) {
            privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyPEM}\n-----END PRIVATE KEY-----`;
        }
        console.log("Decrypted private key (PEM):", privateKeyPEM);
        // Import the private key (PKCS#8 format)
        const ecPrivateKey = await importPKCS8(privateKeyPEM, 'ES256');
        // Get the current time in seconds (Unix time)
        const now = Math.floor(Date.now() / 1000);
        // JWT Header
        const protectedHeader = {
            alg: 'ES256',
            kid: keyID,
            typ: 'JWT',
        };
        // JWT Payload
        const payload = {
            iss: issuerID,
            iat: now,
            exp: now + 20 * 60,
            aud: 'appstoreconnect-v1',
        };
        // Create and sign the JWT
        const jwt = await new SignJWT(payload)
            .setProtectedHeader(protectedHeader)
            .sign(ecPrivateKey);
        // Return the generated JWT in the response
        res.status(200).json({ jwt });
    }
    catch (error) {
        console.error("Error generating JWT:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: "Error generating JWT", error: error.message });
        }
        else {
            res.status(500).json({ message: "Error generating JWT", error: String(error) });
        }
    }
}
