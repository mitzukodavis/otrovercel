# Jam Vercel — buscador integrado sin API Key

Esta versión reemplaza el buscador basado en instancias públicas de Invidious por **youtubei.js**, cliente no oficial de YouTube. La búsqueda se realiza desde la ruta `/api/search` de Next.js y devuelve hasta diez videos con título, canal y miniatura. Los invitados pueden añadirlos a la cola directamente.

## Despliegue

1. Sube los archivos de este ZIP a GitHub, reemplazando los anteriores.
2. En Vercel, despliega el proyecto Next.js; Vercel instalará las dependencias desde `package.json`.
3. Conserva la conexión existente de Vercel Blob. No hace falta `YOUTUBE_API_KEY`.

Se conservan las funciones existentes: salas compartidas, lista, historial, arrastrar y soltar, extracción de títulos y crossfade.

**Advertencia:** `youtubei.js` es un cliente no oficial. YouTube puede cambiar sus mecanismos o restringir las consultas, de modo que no se garantiza disponibilidad permanente. Respeta las condiciones de uso de YouTube. La funcionalidad no se ha probado en un despliegue real de Vercel.
