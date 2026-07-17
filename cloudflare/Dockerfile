FROM docker.io/library/node:25-bookworm-slim

WORKDIR /app

COPY HappyFunTimes/package.json HappyFunTimes/package-lock.json ./HappyFunTimes/
RUN cd HappyFunTimes && npm ci --omit=dev

COPY minimachines/package.json minimachines/package-lock.json ./minimachines/
RUN cd minimachines && npm ci --omit=dev

COPY HappyFunTimes ./HappyFunTimes
COPY minimachines ./minimachines

WORKDIR /app/minimachines
ENV PORT=18679
CMD ["node", "start.js"]
