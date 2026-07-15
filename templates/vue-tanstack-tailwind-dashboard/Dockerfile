FROM ghcr.io/voidzero-dev/vite-plus:latest AS build

ARG VITE_ROOT_PREFIX_URL=""
ARG VITE_API_MODE="mock"
ARG VITE_GLOBAL_APP_TITLE="__PROJECT_NAME__"
ENV VITE_ROOT_PREFIX_URL=${VITE_ROOT_PREFIX_URL}
ENV VITE_API_MODE=${VITE_API_MODE}
ENV VITE_GLOBAL_APP_TITLE=${VITE_GLOBAL_APP_TITLE}

WORKDIR /app

COPY --chown=vp:vp package.json pnpm-workspace.yaml pnpm-lock.yaml .node-version* ./

RUN vp install --frozen-lockfile

COPY --chown=vp:vp . .

RUN vp build

FROM nginx:1.26.3 AS production

ARG VITE_ROOT_PREFIX_URL=""
ENV APP_BASE_PATH=${VITE_ROOT_PREFIX_URL}
ENV BACKEND_URL=http://backend:8000

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /tmp/app-dist

RUN mkdir -p "/usr/share/nginx/html${APP_BASE_PATH}" \
  && cp -a /tmp/app-dist/. "/usr/share/nginx/html${APP_BASE_PATH}/" \
  && rm -rf /tmp/app-dist

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
