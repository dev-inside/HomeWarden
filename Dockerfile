FROM oven/bun:alpine

RUN apk add --no-cache git curl bash

RUN git clone https://github.com/dev-inside/HomeWarden.git /app

WORKDIR /app

RUN bun install

RUN mkdir -p /app/custom/icons

COPY ./config.toml /app/custom/
COPY ./update-icons.sh /app/
RUN chmod +x /app/update-icons.sh

RUN /app/update-icons.sh

VOLUME ["/app/custom"]

EXPOSE 3000

CMD ["bun", "start"]