import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const SEED_KEY = 'db_seeded_v1';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export async function seedDatabase(driver: any) {
  if (localStorage.getItem(SEED_KEY)) return;

  const hash = await bcrypt.hash('Password1', 12);
  await driver.exec(
    `INSERT OR IGNORE INTO users VALUES ('u1','Test User','test@example.com','+14155551234','${hash}','1990-01-01',1,NULL,datetime('now'))`
  );
  await driver.exec(
    `INSERT OR IGNORE INTO addresses VALUES ('a1','u1','Home','123 Main St','San Francisco','CA','94102',37.77,-122.41,1)`
  );
  await driver.exec(`INSERT OR IGNORE INTO restaurants VALUES
    ('r1','Pizza Palace','Best wood-fired pizza','/assets/imgs/pizza.png',37.77,-122.41,4.5,2.99,15,30),
    ('r2','Burger Barn','Gourmet smash burgers','/assets/imgs/burger.png',37.78,-122.42,4.2,0,10,20),
    ('r3','Sushi Spot','Fresh daily sushi','/assets/imgs/sushi.png',37.76,-122.40,4.8,3.99,25,45)`
  );
  await driver.exec(`INSERT OR IGNORE INTO menu_categories VALUES
    ('mc1','r1','Pizzas',1),('mc2','r1','Drinks',2),
    ('mc3','r2','Burgers',1),('mc4','r2','Sides',2),
    ('mc5','r3','Rolls',1),('mc6','r3','Starters',2)`
  );
  await driver.exec(`INSERT OR IGNORE INTO menu_items VALUES
    ('mi1','mc1','Margherita','Classic tomato & mozzarella',12.99,'/assets/imgs/margherita.png',1),
    ('mi2','mc1','Pepperoni','Double pepperoni',14.99,'/assets/imgs/pepperoni.png',1),
    ('mi3','mc2','Cola','Chilled Coca-Cola',2.99,NULL,1),
    ('mi4','mc3','Smash Burger','Double smash patty',13.99,'/assets/imgs/smashburger.png',1),
    ('mi5','mc4','Fries','Crispy fries',4.99,NULL,1),
    ('mi6','mc5','Salmon Roll','Fresh salmon 8pc',16.99,'/assets/imgs/salmonroll.png',1)`
  );
  await driver.exec(`INSERT OR IGNORE INTO promo_codes VALUES
    ('p1','WELCOME20','percent',20,0,'2099-01-01T00:00:00Z',1000,0),
    ('p2','FLAT5','flat',5,20,'2099-01-01T00:00:00Z',500,0)`
  );
  const otpHash = await sha256('123456');
  await driver.exec(
    `INSERT OR REPLACE INTO otp_tokens VALUES ('otp1','u1','${otpHash}','2099-12-31T00:00:00Z',0,0)`
  );
  localStorage.setItem(SEED_KEY, '1');
}