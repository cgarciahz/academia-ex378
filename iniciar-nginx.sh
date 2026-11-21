#!/usr/bin/env bash
# Levanta o recarga Nginx en el puerto 8888 sirviendo la Academia EX378
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f /tmp/nginx-ex378.pid ] && kill -0 "$(cat /tmp/nginx-ex378.pid)" 2>/dev/null; then
    nginx -e /tmp/nginx-ex378-error.log -c "$DIR/nginx.conf" -s reload
    echo "✅ Nginx recargado en: http://localhost:8888"
else
    nginx -e /tmp/nginx-ex378-error.log -c "$DIR/nginx.conf"
    echo "🚀 Academia EX378 iniciada con Nginx en: http://localhost:8888"
fi
