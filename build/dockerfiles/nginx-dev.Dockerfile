FROM nginx:latest AS final
COPY ./build/nginx/food-dev.conf /etc/nginx/nginx.conf
