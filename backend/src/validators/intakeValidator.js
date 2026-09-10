/**
 * Intake Validator (§47)
 * Validates request payloads before processing business logic.
 */
function validateStartSessionPayload(req, res, next) {
  const { patientName, age, gender } = req.body;
  const errors = [];

  if (!patientName || typeof patientName !== 'string' || !patientName.trim()) {
    errors.push('patientName is required and must be a valid string.');
  }

  if (age === undefined || isNaN(Number(age)) || Number(age) <= 0 || Number(age) > 120) {
    errors.push('age is required and must be a number between 1 and 120.');
  }

  if (!gender || !['male', 'female', 'other'].includes(String(gender).toLowerCase())) {
    errors.push('gender is required and must be Male, Female, or Other.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      errors
    });
  }

  next();
}

module.exports = {
  validateStartSessionPayload
};
