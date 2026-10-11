# Dice Roll API

A serverless Dice Roll API built with AWS Lambda, Amazon API Gateway, and AWS SAM.
A single public endpoint rolls a die with a caller-specified number of sides and
returns the result as JSON.

Built by following the AWS Builder tutorial
[Build a Serverless Dice Roll API](https://builder.aws.com/content/3Bl1ZPShZdu8G0OfzFlOHXvfed9/build-a-serverless-dice-roll-api).

## API

```
GET /roll?sides=20
```

| Query param | Required | Default | Notes |
|-------------|----------|---------|-------|
| `sides`     | no       | 6       | Integer in `[2, 100]`. Out-of-range values return HTTP 400. |

### Example responses

`GET /roll?sides=20`

```json
{ "sides": 20, "roll": 17 }
```

`GET /roll` (no params)

```json
{ "sides": 6, "roll": 4 }
```

`GET /roll?sides=1` (out of range)

```json
{ "error": "Sides must be between 2 and 100." }
```

## Project structure

```
dice-roll-api/
├── lambda/
│   └── index.mjs        # Lambda handler (Node.js 24.x, ESM)
├── tests/
│   └── handler.test.mjs # node:test + fast-check property tests
├── template.yaml        # AWS SAM infrastructure as code
├── samconfig.toml       # Saved SAM deploy parameters
└── package.json
```

## Prerequisites

- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Node.js 24 or later
- An AWS account with configured credentials

## Local testing

```bash
npm install
npm test
```

The test suite covers the handler with 5 property-based tests (via `fast-check`,
100 iterations each) plus example/edge tests.

## Build and deploy

```bash
sam validate
sam build
sam deploy --guided
```

## Tear down

```bash
sam delete
```

## License

MIT
