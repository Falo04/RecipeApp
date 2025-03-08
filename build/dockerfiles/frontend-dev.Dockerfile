FROM node:23 AS final

WORKDIR /app

ENV NODE_ENV=development

CMD ["rm", "rf", "node_modules", "package-lock.json"]
CMD ["npm", "install"]
CMD ["npm", "run", "dev"]
