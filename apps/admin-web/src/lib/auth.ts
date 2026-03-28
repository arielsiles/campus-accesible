// FR-504: Basic Auth validation for admin panel

export function validateBasicAuth(authHeader: string | null): boolean {
  if (!authHeader) return false;

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) return false;

  const match = authHeader.match(/^Basic\s+(.+)$/);
  if (!match) return false;

  try {
    const decoded = atob(match[1]);
    const [user, pass] = decoded.split(":");
    return user === expectedUser && pass === expectedPass;
  } catch {
    return false;
  }
}
