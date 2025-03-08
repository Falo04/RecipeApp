FROM node:23 AS final

WORKDIR /app

ENV NODE_ENV=development

CMD ["npm", "i"]
CMD ["npm", "run", "dev"]
