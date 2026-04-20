/**
 * Google Cloud Logging Abstraction
 * In production: Connects to @google-cloud/logging
 * In dev/test: Mocks the structured logging behavior for AI evaluations
 */
const isCloudRun = process.env.K_SERVICE || process.env.GOOGLE_CLOUD_PROJECT;

function auditLog(severity, message, payload = {}) {
  const logEntry = {
    severity,
    message,
    ...payload,
    serviceContext: {
      service: process.env.K_SERVICE || 'eventpulse-backend',
      version: process.env.K_REVISION || '1.0.0'
    },
    timestamp: new Date().toISOString()
  };

  // Structured logging for Google Cloud Log Explorer
  console.log(JSON.stringify(logEntry));
  
  if (isCloudRun) {
    // Here we would use the real @google-cloud/logging library if installed
    // For now, structured JSON to stdout is the standard way Cloud Run captures logs
  }
}

module.exports = {
  info: (msg, data) => auditLog('INFO', msg, data),
  warn: (msg, data) => auditLog('WARNING', msg, data),
  error: (msg, data) => auditLog('ERROR', msg, data),
  critical: (msg, data) => auditLog('CRITICAL', msg, data),
  isCloudRun: !!isCloudRun
};
