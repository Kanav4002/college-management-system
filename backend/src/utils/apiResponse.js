// Response helpers. The original Spring backend returned plain DTOs (no
// envelope), and the React frontend reads `res.data` directly. We keep the
// same contract here so the frontend keeps working unchanged.

function ok(res, data = null, status = 200) {
  if (data === null || data === undefined) {
    return res.status(status).end();
  }
  return res.status(status).json(data);
}

function created(res, data = null) {
  return ok(res, data, 201);
}

function noContent(res) {
  return res.status(204).end();
}

// Plain text body — used by /forgot-password and /reset-password where the
// Spring controller historically returned a confirmation string.
function text(res, message, status = 200) {
  return res.status(status).type('text/plain').send(message);
}

module.exports = { ok, created, noContent, text };
