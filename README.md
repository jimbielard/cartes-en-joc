# Cartes en Joc

Aplicació web per decidir entre restaurants amb un grup. Els usuaris es logegen amb Google, creen o s’uneixen a una sessió, voten un restaurant i veuen el guanyador en temps real (o quasi en temps real, segons la base de dades).

## Stack

- Next.js 16
- App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth / Auth.js
- Google OAuth

## Requisits

- Node.js 20+
- PostgreSQL amb una base de dades disponible
- Google OAuth Client ID i Secret

## Variables d’entorn

Copia `.env.example` a `.env` i completa els valors:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME?schema=public"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_PLACES_API_KEY="..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-llarg-i-aleatori"
```

## Instal·lació local

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Obre http://localhost:3000

## Prisma

Per aplicar les migracions versionades a una base de dades existent:

```bash
npx prisma migrate deploy
```

La migració `20260912010000_complete_voting` incorpora les categories i les
puntuacions per categoria, i garanteix una única participació per usuari i sessió.
Conserva una participació si hi havia registres duplicats del mateix usuari.
Cal aplicar-la abans d'utilitzar la nova versió de l'aplicació.

Els resultats es consulten automàticament cada cinc segons. Les puntuacions
es mostren sobre 10; els vots es poden actualitzar sense duplicar-los.
Els noms afegits manualment són invitacions; els usuaris que entren amb codi
es registren amb el seu compte de Google.

Si canvies el schema:

```bash
npx prisma migrate dev
# o, si ja tens la DB preparada:
npx prisma db push
```

## Google OAuth

A la Google Cloud Console, configura la pantalla de consentiment i els OAuth credentials:

- Authorized JavaScript origins:
  - http://localhost:3000
  - https://tu-app.vercel.app
- Authorized redirect URIs:
  - http://localhost:3000/api/auth/callback/google
  - https://tu-app.vercel.app/api/auth/callback/google

## Desplegament a Vercel

1. Pujar el repositori a GitHub.
2. Crear un projecte a Vercel.
3. Configurar les variables d’entorn de producció:
   - `DATABASE_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_PLACES_API_KEY`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
4. Desplegar.
5. En producció, `NEXTAUTH_URL` ha de ser la URL real de Vercel, per exemple:
   `https://cartes-en-joc.vercel.app`

### Google Places a Vercel

Per activar la cerca real de restaurants, crea una clau a Google Cloud amb la API de Places API i afegeix-la a Vercel com a variable `GOOGLE_PLACES_API_KEY`.

## Scripts útils

```bash
npm run dev
npm run build
npm run start
npx prisma studio
```

## Flux de l’app

La portada inclou una cerca de restaurants i les 12 valoracions més recents de
tota la comunitat. El perfil permet editar nom, àlies i biografia, i consultar
l'historial personal paginat. El correu continua vinculat a Google.

Des del cercador es pot crear una sessió i votar el restaurant seleccionat.
La nota es calcula al servidor com la mitjana de les categories puntuades:
el zero compta, les categories buides o ocultes no. Cal puntuar-ne almenys una.
Les notes antigues es mostren a partir de les categories desades, quan n'hi ha.

Amb el servidor local iniciat, `node scripts/verify-flows.mjs` verifica el flux
amb dos comptes temporals i elimina les dades de prova en acabar.

1. Login amb Google
2. Crear una sessió
3. Compartir codi
4. Unir-se amb codi
5. Votar restaurant
6. Veure resultats i guanyador
