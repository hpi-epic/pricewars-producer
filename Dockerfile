FROM node:8

ENV APP_HOME /producer
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

ADD . $APP_HOME

RUN npm install

CMD ["./wait-for-it.sh", "kafka:9092", "-t", "0", "--", "node", "app.js"]
