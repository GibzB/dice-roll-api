export const handler = async (event) => {
  // API Gateway passes query string params (?sides=20) through the event object.
  const params = event.queryStringParameters || {};
  // Default to a standard 6-sided die if we don't get a value for sides.
  const sides = parseInt(params.sides) || 6;
  // A 1-sided die isn't a die, and anything more than 100 sides is just chaos. We'll return a client error.
  if (sides < 2 || sides > 100) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Sides must be between 2 and 100.",
      }),
    };
  }

  // Calculate a random integer between 1 and sides.
  const result = Math.floor(Math.random() * sides) + 1;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sides: sides,
      roll: result,
    }),
  };
};
