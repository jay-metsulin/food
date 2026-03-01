import { SQLocal } from 'sqlocal';

const db = new SQLocal('delivery-app.sqlite3');

export const driver = {
  async exec(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    if (params && params.length > 0) {
      // Parameterized query — db.sql accepts plain strings with ? placeholders
      const rows = await db.sql(sql, ...params);
      return { rows: rows ?? [] };
    }
    // No params — may be multi-statement DDL (CREATE TABLEs separated by ;)
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    let lastRows: any[] = [];
    for (const stmt of statements) {
      lastRows = await db.sql(stmt);
    }
    return { rows: lastRows ?? [] };
  }
};
