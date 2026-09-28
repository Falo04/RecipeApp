#!/usr/bin/env bash

CA_KEY="/tmp/recipe-ca.key"
CA_CRT="data/ca-certificates/ca-dev.crt"

NGINX_KEY="data/nginx/recipe-dev.key"
NGINX_CRT="data/nginx/recipe-dev.crt"

openssl \
    req -new -x509 \
    -newkey rsa:4096 \
    -keyout $CA_KEY \
    -noenc \
    -out $CA_CRT \
    -subj '/CN=Recipe CA/O=DevCerts' \
    -addext 'subjectKeyIdentifier = hash' \
    -addext 'basicConstraints = critical,CA:true' \
    -addext 'keyUsage = critical, digitalSignature, cRLSign, keyCertSign' \
    -not_after 99991231235959Z

openssl \
    req -new -x509 \
    -newkey rsa:4096 \
    -keyout $NGINX_KEY \
    -noenc \
    -out $NGINX_CRT \
    -CA $CA_CRT \
    -CAkey  $CA_KEY \
    -subj '/CN=Recipe Server/O=DevCerts' \
    -addext 'basicConstraints = critical,CA:false' \
    -addext 'subjectAltName = DNS:localhost, DNS:nginx-dev' \
    -not_after 99991231235959Z