# Jam Vercel — Buscador oficial YouTube Data API v3

Configura en Vercel > proyecto otrovercel > Settings > Environment Variables:

- `YOUTUBE_API_KEY`: clave nueva de Google Cloud (Secret, Production y Preview). **No se incluye en este ZIP**.
- Conserva las variables de Vercel Blob existentes.

Habilita YouTube Data API v3 en Google Cloud y restringe la clave a esta API. Después de guardar la variable, despliega de nuevo el proyecto.

El buscador obtiene hasta 15 videos con **una sola consulta**, muestra 3 y permite mostrar otros 3 sin nuevas consultas. Se cachean consultas idénticas en memoria por 6 horas (caché no garantizada entre instancias ni despliegues). Cada búsqueda nueva cuesta 100 unidades de cuota, independientemente de si devuelve 3 o 15 resultados. Google normalmente asigna 10 000 unidades diarias por proyecto; otras operaciones también consumen cuota. No se ha implementado un límite diario global estricto.

La clave queda únicamente en el servidor. Se conservan reproducción, historial, drag-and-drop y demás funcionalidades del proyecto anterior.
