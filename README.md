# Getting started

## Clone the repo

Clone the project repo in a folder of your choice by running the following command in your terminal

```
git clone https://github.com/Sanish1246/ReserVue-Backend.git
```

## Installing dependencies

Navigate to the cloned repo folder

```
cd reservue-backend
```

Run the following command to install all the dependencies

```
npm install
```

## Environment variables

To use this app locally, you will need create a .env file and insert the following environment variables:

```
MONGODB_URI=[URI to the mongodb database]
NODE_ENV=development
FRONTEND_ORIGIN=[Link to the front end of the application]
DB_NAME=[Name of the database]
```

## Starting the application

run the following command to start the Node server to use the application

```
nodemon server.js

```

## Accessing the front end

The frontend for this application is available on https://github.com/Sanish1246/ReserVue-Backend
