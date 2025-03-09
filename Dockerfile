FROM node:lts-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ../ /app
RUN npm run build

# Production
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]

# Development
FROM build-stage as development-stage
EXPOSE 3000
CMD ["npm", "run", "dev"]
## , "--", "--host", "--debug"]


# Production proxy to development
FROM production-stage as production-proxy-stage
COPY nginx-proxy.conf /etc/nginx/conf.d/default.conf

