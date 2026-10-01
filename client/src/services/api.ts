export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  const storedUrl = localStorage.getItem('labguard_api_url');
  if (storedUrl && storedUrl.trim() !== '') {
    return storedUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function setApiBaseUrl(url: string) {
  const cleaned = url.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (cleaned) {
    localStorage.setItem('labguard_api_url', cleaned);
  } else {
    localStorage.removeItem('labguard_api_url');
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('labguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = `${baseUrl}/api${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    if (!baseUrl && window.location.hostname.includes('vercel.app')) {
      throw new Error('Backend URL is not configured on Vercel. Please set VITE_API_URL or enter your Render backend URL.');
    }
    throw new Error(networkErr.message || 'Network connection failed. Please ensure the backend server is running.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 405 && !baseUrl && window.location.hostname.includes('vercel.app')) {
      const err: any = new Error(
        'Backend not connected (Status 405). The frontend on Vercel needs your Render backend URL. Please configure VITE_API_URL in Vercel or enter your Render backend URL.'
      );
      err.status = 405;
      err.data = data;
      throw err;
    }

    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err: any = new Error(errorMsg);
    err.data = data;
    err.status = response.status;
    throw err;
  }

  return data;
}

export const api = {
  // Auth & Student Self-Registration
  login: (credentials: { email?: string; usn?: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerStudent: (data: { name: string; usn: string; email: string; semester: number; batch?: string; department?: string; phone?: string; password: string }) =>
    request<any>('/auth/register-student', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (data: { name?: string; email?: string; password?: string }) =>
    request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getDemoUsers: () => request<any>('/auth/demo-users'),

  // Labs & Experiments
  getLabs: (params?: { semester?: number | string }) => {
    const query = new URLSearchParams();
    if (params?.semester && params.semester !== 'ALL') query.append('semester', String(params.semester));
    return request<any>(`/labs?${query.toString()}`);
  },
  getLab: (id: number | string) => request<any>(`/labs/${id}`),
  createLab: (data: any) => request<any>('/labs', { method: 'POST', body: JSON.stringify(data) }),
  updateLab: (id: number | string, data: any) => request<any>(`/labs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLab: (id: number | string) => request<any>(`/labs/${id}`, { method: 'DELETE' }),
  getExperiments: (labId: number | string) => request<any>(`/labs/${labId}/experiments`),
  updateExperiment: (id: number | string, data: any) =>
    request<any>(`/labs/experiments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Semesters
  getSemesters: () => request<any>('/semesters'),
  createSemester: (data: { number: number; name: string; academic_year?: string }) =>
    request<any>('/semesters', { method: 'POST', body: JSON.stringify(data) }),
  deleteSemester: (id: number | string) => request<any>(`/semesters/${id}`, { method: 'DELETE' }),

  // Faculty / Teachers
  getFaculty: () => request<any>('/faculty'),
  createFaculty: (data: { name: string; email: string; employee_id: string; designation: string; specialization?: string; password?: string }) =>
    request<any>('/faculty', { method: 'POST', body: JSON.stringify(data) }),
  updateFaculty: (id: number | string, data: any) =>
    request<any>(`/faculty/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFaculty: (id: number | string) => request<any>(`/faculty/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params?: { semester?: number | string; status?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.semester && params.semester !== 'ALL') query.append('semester', String(params.semester));
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<any>(`/students?${query.toString()}`);
  },
  createStudent: (data: { name: string; usn: string; email: string; semester: number; batch?: string; department?: string; phone?: string; password?: string }) =>
    request<any>('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: number | string, data: any) =>
    request<any>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyStudent: (id: number | string) =>
    request<any>(`/students/${id}/verify`, { method: 'POST' }),
  verifyAllStudents: () =>
    request<any>('/students/verify-all', { method: 'POST' }),
  deleteStudent: (id: number | string) => request<any>(`/students/${id}`, { method: 'DELETE' }),

  // Lab Sessions
  startSession: (data: any) => request<any>('/sessions/start', { method: 'POST', body: JSON.stringify(data) }),
  endSession: (id: number | string) => request<any>(`/sessions/${id}/end`, { method: 'POST' }),
  unlockAttendanceWindow: (id: number | string) => request<any>(`/sessions/${id}/unlock-window`, { method: 'POST' }),
  getActiveSessions: () => request<any>('/sessions/active'),
  getLiveSession: (id: number | string) => request<any>(`/sessions/${id}/live`),
  getStudentLabScheduleStatus: () => request<any>('/sessions/student-status'),

  // Dynamic QR
  generateQR: (data: { session_id: number; duration_seconds?: number }) =>
    request<any>('/qr/generate', { method: 'POST', body: JSON.stringify(data) }),
  validateQR: (token: string) =>
    request<any>('/qr/validate', { method: 'POST', body: JSON.stringify({ token }) }),

  // Attendance & Unified Submission
  submitUnifiedAttendanceFeedback: (data: any) =>
    request<any>('/attendance/submit-unified', { method: 'POST', body: JSON.stringify(data) }),
  checkInAttendance: (data: { session_id: number; latitude: number; longitude: number; accuracy?: number; device_fingerprint?: string }) =>
    request<any>('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  takeAttendance: (data: { laboratory_id: number; semester: number; date?: string; time_slot?: string; attendance: Array<{ student_id: number; status: string; remarks?: string }> }) =>
    request<any>('/attendance/take', { method: 'POST', body: JSON.stringify(data) }),
  getRoster: (params: { semester: number; laboratory_id?: number; date?: string }) => {
    const query = new URLSearchParams();
    query.append('semester', String(params.semester));
    if (params.laboratory_id) query.append('laboratory_id', String(params.laboratory_id));
    if (params.date) query.append('date', params.date);
    return request<any>(`/attendance/roster?${query.toString()}`);
  },
  getTeacherAttendanceSessions: () => request<any>('/attendance/teacher/sessions'),
  getAllAttendance: (params?: { semester?: number | string; date?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.semester && params.semester !== 'ALL') query.append('semester', String(params.semester));
    if (params?.date) query.append('date', params.date);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<any>(`/attendance/all?${query.toString()}`);
  },
  getStudentAttendance: (studentId: string = 'me') => request<any>(`/attendance/student/${studentId}`),
  getSessionAttendance: (sessionId: number | string) => request<any>(`/attendance/session/${sessionId}`),

  // Feedback
  submitFeedback: (data: any) => request<any>('/feedback/submit', { method: 'POST', body: JSON.stringify(data) }),
  submitDirectFeedback: (data: any) => request<any>('/feedback/submit-direct', { method: 'POST', body: JSON.stringify(data) }),
  getAllFeedback: (params?: { semester?: number | string; laboratory_id?: number | string; faculty_id?: number | string; rating?: number | string }) => {
    const query = new URLSearchParams();
    if (params?.semester && params.semester !== 'ALL') query.append('semester', String(params.semester));
    if (params?.laboratory_id && params.laboratory_id !== 'ALL') query.append('laboratory_id', String(params.laboratory_id));
    if (params?.faculty_id && params.faculty_id !== 'ALL') query.append('faculty_id', String(params.faculty_id));
    if (params?.rating) query.append('rating', String(params.rating));
    return request<any>(`/feedback/all?${query.toString()}`);
  },
  getStudentFeedback: (studentId: string = 'me') => request<any>(`/feedback/student/${studentId}`),
  getSessionFeedback: (sessionId: number | string) => request<any>(`/feedback/session/${sessionId}`),

  // Timetable
  getTimetables: () => request<any>('/timetable'),
  getSemesterTimetable: (semester: number) => request<any>(`/timetable/${semester}`),

  // Verification Engine
  getVerificationRecords: (params?: { status?: string; lab_id?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.lab_id) query.append('lab_id', params.lab_id);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<any>(`/verification?${query.toString()}`);
  },
  getVerificationDetail: (feedbackId: number | string) => request<any>(`/verification/${feedbackId}/detail`),
  resolveVerification: (feedbackId: number | string, data: { decision: string; notes?: string }) =>
    request<any>(`/verification/${feedbackId}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<any>(`/alerts?${query.toString()}`);
  },
  resolveAlert: (alertId: number | string, data: { status: string; resolution_notes?: string }) =>
    request<any>(`/alerts/${alertId}/resolve`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getAttendanceReport: (params?: any) => {
    const query = new URLSearchParams(params || {});
    return request<any>(`/reports/attendance?${query.toString()}`);
  },
  getVerificationReport: (params?: any) => {
    const query = new URLSearchParams(params || {});
    return request<any>(`/reports/verification?${query.toString()}`);
  },
  getExperimentsReport: () => request<any>('/reports/experiments'),

  // Analytics
  getDepartmentAnalytics: (params?: { semester?: number | string }) => {
    const query = new URLSearchParams();
    if (params?.semester && params.semester !== 'ALL') query.append('semester', String(params.semester));
    return request<any>(`/analytics/department?${query.toString()}`);
  },

  // Audit Logs
  getAuditLogs: (params?: { action?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    return request<any>(`/audit-logs?${query.toString()}`);
  },

  // System maintenance & clean
  cleanDatabase: () => request<any>('/demo/clean-db', { method: 'POST' }),
  resetDemoDatabase: () => request<any>('/demo/reset-db', { method: 'POST' }),
  runDemoScenario: (scenario: string) =>
    request<any>('/demo/run-scenario', { method: 'POST', body: JSON.stringify({ scenario }) })
};
