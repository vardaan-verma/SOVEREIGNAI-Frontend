// ─── Auth API ────────────────────────────────────────────────────────────────
// Currently running in SIMULATED mode while backend is not ready.
// To switch to real API: comment out the simulation block and
// uncomment the real fetch block below it.
//
// Valid demo credentials:
// EMP-1 / CHAPRANA, EMP-2 / VERMA, EMP-3 / JAISWAL,
// EMP-4 / SIROHI, EMP-5 / JANGID
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ── VALID DEMO CREDENTIALS ────────────────────────────────────────────────────
const DEMO_USERS = {
  'EMP-9428': { accessToken: 'demo-pass-2026', name: 'Alex Mercer' },
  'EMP-1': { accessToken: 'CHAPRANA', name: 'Sujal Chaprana' },
  'EMP-2': { accessToken: 'VERMA', name: 'Vardaan Verma' },
  'EMP-3': { accessToken: 'JAISWAL', name: 'Deepma Jaiswal' },
  'EMP-4': { accessToken: 'SIROHI', name: 'Sania Sirohi' },
  'EMP-5': { accessToken: 'JANGID', name: 'Yash Jangid' },
};

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

  const demoUser = DEMO_USERS[employeeId];
  if (demoUser && accessToken === demoUser.accessToken) {
    return {
      success: true,
      message: 'Authentication successful. Directing to SOVA workspace...',
      data: {
        employee_id: employeeId,
        name: demoUser.name,
        role: 'admin',
        session: 'demo-token'
      },
    };
  }

  return {
    success: false,
    message: 'Invalid Employee ID or Access Token. Please check your credentials.',
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
  // const userObj = data.user || data;
  // return {
  //   success: true,
  //   message: data.message || 'Authentication successful.',
  //   data: {
  //     employee_id: userObj.employee_id || employeeId,
  //     name: userObj.name || userObj.full_name || userObj.username || 'Alex Mercer',
  //     role: userObj.role || 'user',
  //     session: data.token || data.access_token || 'session-token'
  //   }
  // };
  // ─────────────────────────────────────────────────────────────────────────
}