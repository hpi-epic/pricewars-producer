FROM node:latest
ADD . /producer
WORKDIR /producer
RUN npm install
CMD node app.js