import db from './backend/db/index.js';

async function test() {
    console.log('Apps:', JSON.stringify(db.data.apps, null, 2));
    process.exit(0);
}

test();
