// ─── Auth API ────────────────────────────────────────────────────────────────
// Currently running in SIMULATED mode while backend is not ready.
// To switch to real API: comment out the simulation block and
// uncomment the real fetch block below it.
//
// Valid demo credentials: EMP-9428  /  demo-pass-2026
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ── VALID DEMO CREDENTIALS ────────────────────────────────────────────────────
const DEMO_EMPLOYEE_ID = 'EMP-9428';
const DEMO_ACCESS_TOKEN = 'demo-pass-2026';

/**
 * Authenticates an employee.
 * Currently simulated — swap to real fetch when API is ready.
 *
 * @param {string} employeeId
 * @param {string} accessToken
 * @returns {Promise<{ success: boolean, message: string, data?: any }>}
 */
export async function authenticateUser(employeeId, accessToken) {
  // ── SIMULATION (remove this block when real API is ready) ─────────────────
  await new Promise((r) => setTimeout(r, 1200)); // realistic network delay

  if (employeeId === DEMO_EMPLOYEE_ID && accessToken === DEMO_ACCESS_TOKEN) {
    return {
      success: true,
      message: 'Authentication successful. Directing to SOVA workspace...',
      data: { employee_id: employeeId, role: 'admin', session: 'demo-token' },
    };
  }

  return {
    success: false,
    message: 'Authentication failed. Please check your Employee ID and Access Token.',
  };
  // ── END SIMULATION ────────────────────────────────────────────────────────

  // ── REAL API (uncomment when backend is ready) ────────────────────────────
  // const response = await fetch(`${API_BASE}/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  //   body: JSON.stringify({ employee_id: employeeId, access_token: accessToken }),
  // });
  // const data = await response.json().catch(() => ({}));
  // if (!response.ok) {
  //   return { success: false, message: data.message || data.error || 'Authentication failed.' };
  // }
  // return { success: true, message: data.message || 'Authentication successful.', data };
  // ─────────────────────────────────────────────────────────────────────────
}