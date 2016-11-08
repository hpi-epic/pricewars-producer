FROM node:latest
ADD . /producer
WORKDIR /producer
RUN npm install
CMD npm app.js