import { driver } from './index';
import { CREATE_TABLES_SQL } from './schema';
import { seedDatabase } from './seed';

export async function initDatabase(): Promise<void> {
  await driver.exec(CREATE_TABLES_SQL);
  await seedDatabase(driver);
}