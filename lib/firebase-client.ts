import {getApp,getApps,initializeApp} from 'firebase/app';
import {getAuth,signInAnonymously} from 'firebase/auth';
import {getDatabase,ref,onValue} from 'firebase/database';
const config={apiKey:process.env.NEXT_PUBLIC_FIREBASE_API_KEY,authDomain:process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,databaseURL:process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,projectId:process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,appId:process.env.NEXT_PUBLIC_FIREBASE_APP_ID};
export function watchRoom(code:string,onRoom:(room:unknown)=>void,onError:(message:string)=>void){
 const app=getApps().length?getApp():initializeApp(config);
 const auth=getAuth(app);let unsub:(()=>void)|undefined;let stopped=false;
 signInAnonymously(auth).then(()=>{
  if(stopped)return;
  unsub=onValue(ref(getDatabase(app),'rooms/'+code),snapshot=>onRoom(snapshot.val()),error=>onError(error.message));
 }).catch(error=>onError('Firebase Authentication: '+String(error)));
 return ()=>{stopped=true;unsub?.()};
}
