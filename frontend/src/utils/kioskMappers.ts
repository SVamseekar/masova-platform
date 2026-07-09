/**
 * Normalize GET /users/kiosk payload (UserResponse[]) for manager Kiosks tab.
 */

export interface MappedKioskAccount {
  id: string;
  terminalId: string;
  storeId: string;
  isActive: boolean;
  lastKioskAccess: string | null;
  name: string;
  email: string;
  role?: string;
}

export function mapKioskListResponse(raw: unknown): MappedKioskAccount[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row: Record<string, unknown>) => {
    const email = String(row.email ?? '');
    const name = String(row.name ?? '');
    let terminalId = String(row.terminalId ?? '');
    if (!terminalId && email.startsWith('kiosk.')) {
      // kiosk.{storeId}.{terminalId}@masova.internal
      const mid = email.split('@')[0]?.replace(/^kiosk\./, '') ?? '';
      const parts = mid.split('.');
      if (parts.length >= 2) {
        terminalId = parts.slice(1).join('.');
      }
    }
    if (!terminalId && /Kiosk\s+/i.test(name)) {
      const m = name.match(/Kiosk\s+(\S+)/i);
      if (m) terminalId = m[1];
    }
    if (!terminalId && name) {
      terminalId = name;
    }
    const last =
      (row.lastKioskAccess as string | null | undefined) ??
      (row.lastLogin as string | null | undefined) ??
      null;
    return {
      id: String(row.id ?? ''),
      terminalId: terminalId || 'N/A',
      storeId: String(row.storeId ?? ''),
      isActive: Boolean(row.isActive ?? true),
      lastKioskAccess: last,
      name,
      email,
      role: row.role != null ? String(row.role) : undefined,
    };
  });
}
