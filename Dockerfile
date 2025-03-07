FROM node:22.14.0

WORKDIR /app

RUN apt update 

RUN apt install make build-essential libtool ffmpeg -y 

RUN npm install -g @mapbox/node-pre-gyp pnpm@latest

COPY package.json pnpm-lock.yaml ./

RUN wget http://security.ubuntu.com/ubuntu/pool/universe/p/python2.7/python2.7_2.7.18-13ubuntu1.5_amd64.deb http://security.ubuntu.com/ubuntu/pool/universe/p/python2.7/libpython2.7-stdlib_2.7.18-13ubuntu1.5_amd64.deb http://security.ubuntu.com/ubuntu/pool/universe/p/python2.7/python2.7-minimal_2.7.18-13ubuntu1.5_amd64.deb http://security.ubuntu.com/ubuntu/pool/universe/p/python2.7/libpython2.7-minimal_2.7.18-13ubuntu1.5_amd64.deb

RUN apt install ./libpython2.7-minimal_2.7.18-13ubuntu1.5_amd64.deb ./libpython2.7-stdlib_2.7.18-13ubuntu1.5_amd64.deb ./python2.7-minimal_2.7.18-13ubuntu1.5_amd64.deb ./python2.7_2.7.18-13ubuntu1.5_amd64.deb

RUN ln -s /usr/bin/python2.7 /usr/bin/python

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 6000

CMD ["pnpm", "build:start"]