# JAM + FIREBASE REALTIME DATABASE — GUÍA DE INSTALACIÓN

## 1. Firebase

Proyecto existente: jam-vercel
Realtime Database URL:
https://jam-vercel-default-rtdb.asia-southeast1.firebasedatabase.app

En Firebase Console → Build/Compilación → Authentication → Sign-in method, activa **Anónimo (Anonymous)**.

En Firebase Console → Realtime Database → Reglas, publica:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": false
      }
    },
    "hostKeys": {
      ".read": false,
      ".write": false
    }
  }
}
```

NO cambies las reglas a lectura/escritura pública. Las salas se leen con autenticación anónima y solo el servidor escribe. Las claves de anfitrión están en hostKeys, que los clientes no pueden leer.

## 2. Configuración web de Firebase

En Configuración del proyecto (engranaje) → General → Tus aplicaciones, registra una aplicación web si aún no existe. Copia apiKey, authDomain, projectId y appId de firebaseConfig. El databaseURL ya está indicado arriba.

## 3. Clave privada del servidor

Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada. Descarga el JSON en tu computadora. NO lo compartas, NO lo subas a GitHub y NO lo pongas dentro del ZIP.

Del JSON utiliza los campos `project_id`, `client_email` y `private_key`.

## 4. Variables de entorno en Vercel

Vercel → proyecto → Settings → Environment Variables. Añade para Production, Preview y Development (según corresponda):

NEXT_PUBLIC_FIREBASE_API_KEY = apiKey de firebaseConfig
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = authDomain de firebaseConfig
NEXT_PUBLIC_FIREBASE_DATABASE_URL = https://jam-vercel-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID = projectId de firebaseConfig
NEXT_PUBLIC_FIREBASE_APP_ID = appId de firebaseConfig
FIREBASE_PROJECT_ID = project_id del JSON privado
FIREBASE_CLIENT_EMAIL = client_email del JSON privado
FIREBASE_PRIVATE_KEY = private_key del JSON privado (incluye BEGIN PRIVATE KEY y END PRIVATE KEY; si Vercel no acepta saltos de línea, escribe cada salto como \n)
YOUTUBE_API_KEY = tu clave existente de YouTube Data API

Las variables NEXT_PUBLIC_* son públicas por diseño; FIREBASE_PRIVATE_KEY y FIREBASE_CLIENT_EMAIL son secretos del servidor. Nunca agregues NEXT_PUBLIC_ a la clave privada.

## 5. Subir el ZIP

Descomprime el ZIP. Sube los archivos del proyecto a la raíz del repositorio GitHub que ya usa Vercel, reemplazando los anteriores. Haz Commit. Vercel volverá a desplegar automáticamente. No subas ningún archivo de clave privada.

## 6. Prueba

1. Abre la web y crea una sala.
2. Abre el enlace de sala en otro navegador o celular.
3. Añade una canción desde el invitado.
4. Verifica que aparezca automáticamente en el anfitrión sin recargar.
5. Prueba reproducción, pasar a siguiente, reordenar e historial.
6. En Firebase → Realtime Database → Datos verás `rooms` y `hostKeys`. Los clientes NO pueden leer `hostKeys`.

## Importante

Las salas antiguas de Vercel Blob NO se migran automáticamente: la cuenta de Blob está pausada y no hay acceso a los datos anteriores. Esta versión crea salas nuevas en Firebase.

El plan Spark tiene límites gratuitos. El uso de Firebase y las rutas API de Vercel puede generar consumo; revisa Firebase → Uso. Esta versión elimina las consultas repetitivas de sala cada 2,2 segundos y utiliza eventos Realtime Database.

No se ha podido ejecutar `npm run build` en este entorno porque `npm install` agotó el tiempo disponible; comprueba el primer despliegue en Vercel y comparte los logs si surge un error.
