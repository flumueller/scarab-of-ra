FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node backend ./backend
COPY --chown=node:node db ./db
COPY --chown=node:node dist ./dist
COPY --chown=node:node server.mjs ./
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4173
USER node
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "fetch('http://127.0.0.1:4173/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
