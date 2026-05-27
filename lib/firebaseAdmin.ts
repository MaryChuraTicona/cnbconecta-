import admin from "firebase-admin";

const privateKey =
  process.env
    .FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, "\n");

if (!admin.apps.length) {

  admin.initializeApp({
    credential:
      admin.credential.cert({
        projectId:
          process.env
            .FIREBASE_PROJECT_ID,

        clientEmail:
          process.env
            .FIREBASE_CLIENT_EMAIL,

        privateKey,
      }),
  });

  console.log(
    "🔥 FIREBASE ADMIN INICIADO"
  );
}

export const adminAuth =
  admin.auth();

export const adminDb =
  admin.firestore();