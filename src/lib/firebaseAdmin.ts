import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.STORAGE_BUCKET,
  });
}

const dbAdmin = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { dbAdmin, auth, storage };