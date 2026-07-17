# DreamLifeVps — guía rápida

## Subir a GitHub (repo nuevo: SerToxX/DreamLifeVps)
```bash
mv gitignore .gitignore        # ya viene renombrado en este zip, solo por si acaso
git add -A
git status                     # confirma que .env NO aparezca en la lista
git commit -m "fix: config Docker de producción (pnpm monorepo, MySQL, dockerignore)"
git remote set-url origin https://github.com/SerToxX/DreamLifeVps.git
git branch -M main
git push -u origin main
```

## Subir al VPS
```bash
# En tu PC, clona (o el propio VPS clona desde GitHub):
git clone https://github.com/SerToxX/DreamLifeVps.git /opt/stacks/dreamlife
# Copia el .env real (el de la carpeta env-para-vps/, generado con secretos ya listos):
scp env-para-vps/.env root@TU_IP:/opt/stacks/dreamlife/.env

ssh root@TU_IP
cd /opt/stacks/dreamlife
nano .env   # edita FRONTEND_URL, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL con tu dominio real
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy
docker compose up -d --build
docker compose logs -f api   # revisa que "prisma migrate deploy" haya corrido bien
```
Luego en Nginx Proxy Manager:
- `tudominio.com` → `dreamlife_web` puerto `3000`
- `api.tudominio.com` → `dreamlife_api` puerto `3001`

## Actualizar el VPS después de un cambio
```bash
./deploy.sh
```

## Correr en tu PC (desarrollo, sin Docker para la app)
```bash
pnpm install
cp env-para-vps/api.env.local apps/api/.env
cp env-para-vps/web.env.local apps/web/.env.local

docker compose -f docker-compose.dev.yml up -d   # levanta solo MySQL en localhost:3306
pnpm --filter=api exec prisma migrate dev
pnpm dev   # api en :3001, web en :3000 con hot-reload
```
Abre http://localhost:3000
