# Building a Serverless Dice Roll API on AWS

## What I set out to do

Build and ship a serverless Dice Roll API by following the AWS Builder tutorial,
[Build a Serverless Dice Roll API](https://builder.aws.com/content/3Bl1ZPShZdu8G0OfzFlOHXvfed9/build-a-serverless-dice-roll-api).
The goal: a single public HTTP endpoint that rolls a die with a caller-chosen
number of sides and returns the result as JSON, with no servers to manage.
Completing the deployment also earns a $20 AWS Free Tier credit.

## What got built

A spec-driven serverless app with four moving parts:

- **AWS Lambda** (Node.js 24.x, ESM) a pure handler that reads a `sides` query
  parameter, defaults to 6, validates the `2-100` range, and returns a random roll.
- **Amazon API Gateway** (REST, `GET /roll`) gives the function a public HTTPS URL.
- **AWS SAM** (`template.yaml`) infrastructure as code tying it all together.
- **A local test suite** property-based tests that verify the handler's behavior
  without touching AWS.

The API contract:

```
GET /roll?sides=20   ->  { "sides": 20, "roll": 17 }
GET /roll            ->  { "sides": 6,  "roll": 4 }   (defaults to 6)
GET /roll?sides=1    ->  { "error": "Sides must be between 2 and 100." }   (HTTP 400)
```

## How I approached it

I ran this as a spec before writing code, which kept the work honest and traceable:

1. **Requirements** captured 9 requirements in EARS format. One early catch: I
   reconciled a subtle inconsistency so the spec matched the real behavior
   (`sides=0`, empty, or non-numeric values fall back to 6 and roll successfully;
   only parsed integers below 2 or above 100 return a 400).
2. **Design** architecture diagrams, the handler logic, the SAM template,
   request/response contracts, and five correctness properties for property-based testing.
3. **Tasks** an incremental, dependency-ordered plan from scaffolding through
   deployment and teardown.
4. **Execution** tasks dispatched wave by wave, each verified before moving on.

## Verification

Nothing was taken on faith:

- **Local tests:** 8/8 passing five `fast-check` property tests at 100 iterations
  each (bounded rolls, defaulting, fractional truncation, out-of-range errors,
  always-valid JSON), plus three example/edge tests.
- **Live Lambda config:** confirmed `index.handler`, `nodejs24.x`, 128MB, 5s timeout
  an exact match to the design.
- **Live endpoint:** all smoke cases passed against the deployed URL (`?sides=12` -> 200,
  no params -> 200/sides 6, `?sides=1` -> 400, and a non-GET -> 403, confirming only GET
  is wired).

## Bumps along the way

A few things didn't go perfectly smoothly, and worth noting honestly:

- **SAM CLI wasn't installed.** The build step blocked on a missing CLI. Installing it
  via Homebrew hit a stale lock from an interrupted concurrent run; I diagnosed the
  orphaned lock, cleared it, finished the interrupted `openssl@4` pour, and the install
  completed cleanly.
- **Account switch.** The spec originally named the `K1-Kitstek-Billy` profile, but that
  pointed at a different AWS account. The credit-earning account (`254566860887`) was
  reachable via the `default` profile, so with confirmation I deployed there instead.
  That's a known, intentional deviation from the written Requirement 8.
- **Standalone repo nuance.** The project folder lives inside an unrelated existing git
  repo. Rather than contaminate that, I initialized a fresh, independent repo inside the
  project folder and pushed it to its own GitHub remote.

## The outcome

- **Credit:** received (the deployment completed the Free Tier "Create a web app using
  AWS Lambda" activity).
- **Source:** preserved as a standalone public repo at
  [github.com/GibzB/dice-roll-api](https://github.com/GibzB/dice-roll-api), with a README,
  `.gitignore` (excluding `node_modules` and build artifacts), and the saved SAM config
  for easy redeploy.
- **Cleanup:** the CloudFormation stack was deleted Lambda, API Gateway, and IAM role
  all torn down, endpoint confirmed unreachable, no ongoing charges.
- **Spec:** all 13 tasks completed.

## Redeploying later

Everything needed is in the repo:

```bash
git clone https://github.com/GibzB/dice-roll-api.git
cd dice-roll-api
npm install && npm test
sam build && sam deploy --guided
```

## What's next

This is the backend half of the AWS onboarding series. The next tutorial goes the other
direction launching and managing an EC2 instance serving a page with `httpd`.
