import {SignJWT, importPKCS8} from "jose";
import {VercelRequest, VercelResponse} from "@vercel/node"; // Import types for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.status(405).json({message: "Only POST requests are allowed"});
        return;
    }
    const {keyID, issuerID, privateKey}: { keyID?: string; issuerID?: string; privateKey?: string } = req.body;
    if (!keyID || !issuerID || !privateKey) {
        res.status(400).json({message: "Missing keyID, issuerID, or privateKey"});
        return;
    }
    try {
        // Import the private key (PKCS#8 format)
        const ecPrivateKey = await importPKCS8(privateKey.trim(), 'ES256');
        // Get the current time in seconds (Unix time)
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        // JWT Header
        const protectedHeader = {
            alg: 'ES256', // Elliptic Curve algorithm
            kid: keyID,   // Your Key ID
            typ: 'JWT',   // Token Type
        };
        // JWT Payload
        const payload = {
            iss: issuerID,                 // Issuer ID
            iat: now,                       // Issued at time (current time)
            exp: now + 20 * 60,             // Expiration time (20 minutes later)
            aud: 'appstoreconnect-v1',      // Audience
        };
        // Create and sign the JWT
        const jwt = await new SignJWT(payload)
            .setProtectedHeader(protectedHeader) // Set the protected header
            .sign(ecPrivateKey);                 // Sign the JWT with the private key
        // Return the generated JWT in the response
        res.status(200).json({jwt});
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error generating JWT:", error.message);
            res.status(500).json({message: "Error generating JWT", error: error.message});
        } else {
            // Handle the case where error is not an instance of Error (for example, strings or custom error objects)
            console.error("Unknown error generating JWT:", error);
            res.status(500).json({message: "Unknown error generating JWT", error: String(error)});
        }
    }
}