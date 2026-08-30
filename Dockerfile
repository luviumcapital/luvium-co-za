# Static HTML site — no build step. Served directly by nginx for Coolify.
FROM nginx:1.27-alpine

# Single-page-app-style fallback isn't needed here (multiple standalone
# .html pages), so ship the default nginx config and just drop the files in.
COPY . /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ || exit 1
