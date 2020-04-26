#!/usr/bin/env bash

openssl genrsa -out ca.key 2048;

openssl req -x509 -new -nodes -key ca.key -sha256 -days 1825 -out ca.pem;

openssl genrsa -out server.key 2048;

openssl req -new -key server.key -out server.csr;

openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key -CAcreateserial \
-out server.crt -days 365 -sha256 -extfile x509.ext
