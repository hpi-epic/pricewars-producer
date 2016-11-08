FROM node:6
ADD . /producer
WORKDIR /producer
RUN npm install
CMD node app.js