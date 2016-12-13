FROM node:6

ENV APP_HOME /producer
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

ADD . $APP_HOME

RUN npm install

CMD ["node", "app.js"]
