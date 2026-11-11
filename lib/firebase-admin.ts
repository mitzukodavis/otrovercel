import {cert,getApps,initializeApp} from 'firebase-admin/app';
import {getDatabase as adminDatabase} from 'firebase-admin/database';
export function getDatabase(){
 if(!getApps().length){
  const projectId=process.env.FIREBASE_PROJECT_ID||process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,'\n');
  const databaseURL=process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if(!projectId||!clientEmail||!privateKey||!databaseURL)throw Error('Faltan variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY o NEXT_PUBLIC_FIREBASE_DATABASE_URL');
  initializeApp({credential:cert({projectId,clientEmail,privateKey}),databaseURL});
 }
 return adminDatabase();
}
