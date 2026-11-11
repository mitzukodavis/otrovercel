# Jam Vercel (sin Storage)

Aplicación Next.js que reproduce una cola de videos de YouTube.

## Despliegue

1. Sube los archivos de esta carpeta (no el ZIP) a la raíz de un repositorio GitHub.
2. En https://vercel.com/new importa el repositorio.
3. Framework: Next.js. Pulsa Deploy.
4. No necesitas variables de entorno, Blob ni base de datos.

## Uso

- Pega uno o varios enlaces de YouTube, uno por línea.
- Reproduce, pausa, salta, reordena y elimina videos.
- La lista se conserva en localStorage en ese navegador.
- Compartir lista genera una URL con los IDs de video para abrir una copia en otro dispositivo.

## Limitaciones

No hay salas multiusuario sincronizadas: para eso hace falta un backend compartido (base de datos o servicio de sincronización). Un enlace compartido es una instantánea de la lista. El navegador puede exigir interacción del usuario para reproducir audio. Algunos videos no permiten incrustación.
