# Jam Vercel — cola compartida para YouTube

## Qué hace

- Una PC anfitriona reproduce los videos de YouTube conectada a los parlantes.
- Los invitados entran al enlace de la sala y agregan videos desde cualquier dispositivo.
- La cola se actualiza automáticamente cada ~2 segundos.
- Solo la PC que creó la sala controla reproducción, saltos y eliminación.
- Al terminar un video, el reproductor intenta pasar al siguiente.

## Publicar en Vercel

1. Descomprime el ZIP y sube **el contenido** a la raíz de un repositorio de GitHub.
2. Importa ese repositorio en Vercel, con Framework Next.js.
3. En el proyecto Vercel, abre Storage y conecta tu Vercel Blob Store (Production).
4. Vuelve a desplegar el proyecto **después** de conectar Blob.
5. Abre la web, crea una sala en la PC que reproduce música y comparte el enlace.

**Conexión Blob moderna:** Vercel puede utilizar OIDC y variables BLOB_STORE_ID sin BLOB_READ_WRITE_TOKEN. Este proyecto usa @vercel/blob en funciones del servidor, que resuelve la autenticación del entorno Vercel. No agregues tokens al código ni variables NEXT_PUBLIC_ para credenciales.

## Límites y consideraciones

- El navegador puede requerir un clic en **Reproducir** para activar audio. YouTube puede bloquear algunos videos incrustados.
- La PC anfitriona debe permanecer abierta. Si cierra su pestaña, la cola permanece en Blob pero nadie reproduce.
- La sincronización de la cola es por consulta cada 2.2 segundos; no son WebSockets.
- Para grupos pequeños: Blob es almacenamiento de objetos, no una base de datos transaccional. Agregados exactamente simultáneos pueden sobrescribirse (última escritura gana). Para uso masivo sería mejor un almacén con operaciones atómicas.
- Los JSON de sala son públicos y los enlaces de sala no son secretos. No guardes datos privados.
- Se realizan lecturas y escrituras en Blob y Vercel, sujetas a cuotas de tu plan.
- No soporta importar una playlist completa con un único URL de playlist; sí muchos enlaces individuales.

REPRODUCCION: Los videos comienzan en el segundo 3. Al terminar un video, el anfitrion avanza automaticamente al siguiente. YouTube puede bloquear autoplay hasta que el anfitrion interactue con la pagina.

## Actualización: enlaces de YouTube
- Los invitados ven primero el formulario para agregar enlaces.
- Se admiten watch, youtu.be, shorts, live, embed, YouTube Music, youtube-nocookie y IDs de 11 caracteres.
- Los parámetros de seguimiento, tiempos y listas no cambian el ID.
- Se evitan IDs duplicados en la misma sala.
- Los cambios de cola se comparten usando el almacenamiento Vercel Blob existente.


## Historial de reproducción (nueva función)
- Cuando termina una canción o el anfitrión pulsa «Siguiente», se retira de la cola y pasa al historial con fecha y hora.
- Si el anfitrión elige otra canción mientras está reproduciendo, la canción anterior pasa al historial.
- El historial aparece para todos los participantes y se guarda en Vercel Blob, incluso al vaciar la cola.
- Las salas creadas antes de esta actualización funcionan: el historial se inicializa al finalizar la primera canción.
- Las canciones eliminadas manualmente antes de reproducirse no se añaden al historial.
- El historial no contiene canciones reproducidas antes de instalar esta versión.

## Novedades: crossfade y búsqueda de YouTube

- Dos reproductores de YouTube intentan solapar los últimos **5 segundos** de una canción con los primeros **5 segundos** de la siguiente, subiendo/bajando volumen. El anfitrión mantiene la reproducción y el historial.
- La duración se lee de la IFrame API (`getDuration`, `getCurrentTime`), sin clave adicional.
- En anfitrión e invitados aparece **Buscar canciones en YouTube**. El popup muestra hasta 10 resultados y permite añadir uno a la cola.
- **CONFIGURACIÓN OBLIGATORIA PARA EL BUSCADOR**: habilitar *YouTube Data API v3* en Google Cloud, crear una API key, y añadirla en Vercel > Project > Settings > Environment Variables como `YOUTUBE_API_KEY` (Production/Preview). Redeploy después.
- El crossfade es best-effort: el buffering, autoplay y las restricciones de incrustación de YouTube pueden interrumpir o bloquear mezclas. No es posible garantizar transiciones perfectas en todos los navegadores y videos. Los videos en vivo no tienen una duración final predecible.


## Buscador sin clave de API

El buscador emergente usa instancias públicas de Invidious desde `/api/search` y presenta hasta 10 videos, con botón Agregar a la cola. No requiere YOUTUBE_API_KEY. Las instancias públicas son externas y pueden dejar de funcionar o bloquear solicitudes; como alternativa siempre puedes pegar enlaces. No se incrusta youtube.com, ya que YouTube impide incrustar su página de búsqueda en un iframe.
