// Helper cryptographique pour générer des jetons d'annulation sécurisés et inviolables (HMAC-SHA256)
export async function generateCancellationSignature(
  appointmentId: string,
  clientEmail: string,
  secretKey: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payload = encoder.encode(`${appointmentId}:${clientEmail}`);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, payload);

  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyCancellationSignature(
  appointmentId: string,
  clientEmail: string,
  signature: string,
  secretKey: string
): Promise<boolean> {
  const expectedSignature = await generateCancellationSignature(appointmentId, clientEmail, secretKey);
  return expectedSignature === signature;
}
