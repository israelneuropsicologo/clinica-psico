import { getDb } from './server/db.ts';

const db = await getDb();
if (db) {
  const result = await db.query.clinicalNotes.findMany({
    limit: 5,
    orderBy: (notes) => notes.createdAt,
  });
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log('DB not available');
}
