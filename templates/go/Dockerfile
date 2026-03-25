FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN go build -o service .

FROM alpine:3.18

WORKDIR /app
COPY --from=builder /app/service .

EXPOSE {{SERVICE_PORT}}

CMD ["./service"]
