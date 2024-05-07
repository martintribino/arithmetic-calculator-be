
# Arithmetic Calculator REST API

Implement a Web platform to provide a simple calculator functionality (addition, subtraction, multiplication, division, square root, and a random string generation) where each functionality will have a separate cost per request.
User’s will have a starting credit/balance. Each request will be deducted from the user’s balance. If the user’s balance isn’t enough to cover the request cost, the request shall be denied.
This Web application and its UI application should be live (on any platform of your choice). They should be ready to be configured and used locally for any other developer (having all instructions written for this purpose)

## Requirements

- Node 16 (nvm use 16)
- Mysql server running
- Execute the following sql scripts:
  -- Create db calculator
  CREATE DATABASE calculator;
  -- Create user
  CREATE USER 'mtribino'@'localhost' IDENTIFIED BY 'mtribino18';
  -- Grant access to db
  GRANT ALL ON calculator.* TO 'mtribino'@'localhost';

## Run Locally

Clone the project

```bash
  git clone https://link-to-project
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

Start the tests

```bash
  npm run test
```
