import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../../db/pool.js';
import { rooms, reservations } from './mockData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let initPromise = null;

async function applySchema(client) {
  const ddl = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await client.query(ddl);
}

async function seedIfEmpty(client) {
  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM paul_rooms');
  if (rows[0].n > 0) return;

  for (const r of rooms) {
    await client.query(
      `INSERT INTO paul_rooms (id, number, floor, type, status, assigned_to, notes, bed_configuration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.number, r.floor, r.type, r.status, r.assignedTo, r.notes, r.bedConfiguration],
    );
  }

  for (const r of reservations) {
    await client.query(
      `INSERT INTO paul_reservations
         (id, room_id, guest_name, check_in, check_out, adults, children, infants,
          reservation_status, guest_status, is_unallocated, outstanding_balance,
          payment_expired, room_display_name, late_checkout, bed_configuration)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO NOTHING`,
      [
        r.id, r.roomId, r.guestName, r.checkIn, r.checkOut,
        r.adults, r.children, r.infants,
        r.reservationStatus, r.guestStatus, r.isUnallocated, r.outstandingBalance,
        r.paymentExpired, r.roomDisplayName, r.lateCheckout, r.bedConfiguration,
      ],
    );
  }

  console.log(`[paul/seed] seeded ${rooms.length} rooms and ${reservations.length} reservations`);
}

export function ensureSchema() {
  if (!initPromise) {
    initPromise = (async () => {
      const client = await pool.connect();
      try {
        await applySchema(client);
        await seedIfEmpty(client);
      } finally {
        client.release();
      }
    })().catch(err => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}
