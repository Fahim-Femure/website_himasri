export function nimToEmail(nim: string): string {
  const cleanNim = nim.trim();
  return `${cleanNim}@anggota.himasri.id`;
}

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@himasri.app`;
}

export function identifierToEmail(identifier: string): string {
  const clean = identifier.trim();
  if (/^\d+$/.test(clean)) {
    return nimToEmail(clean);
  }
  return usernameToEmail(clean);
}

export function isValidNim(nim: string): boolean {
  return /^\d{9,12}$/.test(nim.trim());
}

export function isValidLoginIdentifier(identifier: string): boolean {
  const clean = identifier.trim();
  return /^\d{9,12}$/.test(clean) || /^[a-zA-Z][a-zA-Z0-9._-]{2,39}$/.test(clean);
}
