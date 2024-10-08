import { VercelRequest, VercelResponse } from "@vercel/node";

// Define the public key in PEM format
const publicKey: string = `
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAhSq11K0gM5hYhGt79PkX
9y33ScAxC0B5PVYMvtcOS0CGNEBF3ue2mrDncBas2w7WzEm9eYK9A8AiOG9vb6mx
InKRgT9CkPsNvARlIYbrSK71ExUj1YgAfQnq8eahQNvxRiso2qg1Wgs3t8Tsr3GH
/L7N5q+uuC3oAXZbv3AbERvtGgUSylavqbn7fFg+wJi2huP2z1DZ4hf4ip+0n4L2
wppi8WXR4rx3JkWetVG4eUzCbbEZ971PIvTrjl033uoPQzGmguB82V9cxEZHAdLM
z82z4EwJl0kxjEy5msx+ONSbnvp9b2bBz5DqnOOwW22otrtaemXslX+werFY4BEm
/QIDAQAB
-----END PUBLIC KEY-----
`;

export default function handler(req: VercelRequest, res: VercelResponse): void {
    if (req.method === 'OPTIONS') {
        // Handle preflight request
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).end(); // End with a 204 (No Content) status
        return;
    }

    // Add CORS headers for regular requests
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Send the public key as the response
    res.status(200).send(publicKey);
}