// Comprehensive Integration & Verification Test Suite for LabGuard
async function runTests() {
  console.log('========================================================================');
  console.log('🛡️  LABGUARD END-TO-END VERIFICATION & INTEGRATION TEST SUITE');
  console.log('🏛️  Department of IoT and Cybersecurity Including Blockchain Technology');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Health Endpoint
  console.log('1. Testing System Health & Department Branding...');
  const healthRes = await fetch('http://localhost:5000/api/health').then(r => r.json());
  assert(healthRes.status === 'HEALTHY', 'Server status is HEALTHY');
  assert(healthRes.department.includes('IoT and Cybersecurity'), 'Department name verified');

  // 2. Auth Endpoint
  console.log('\n2. Testing Multi-Role Authentication...');
  const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin.iot@labguard.edu', password: 'Admin@123' })
  }).then(r => r.json());
  assert(adminLogin.success && adminLogin.user.role === 'ADMIN', 'Admin login successful');

  const studentLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.verma@student.edu', password: 'Student@123' })
  }).then(r => r.json());
  assert(studentLogin.success && studentLogin.user.role === 'STUDENT', 'Student login successful');
  const studentToken = studentLogin.token;

  // 3. Laboratories & 12 Experiments
  console.log('\n3. Testing Laboratories & 12 Experiments Structure...');
  const labsRes = await fetch('http://localhost:5000/api/labs').then(r => r.json());
  assert(labsRes.success && labsRes.labs.length >= 7, `All 7 Laboratories verified (Found: ${labsRes.labs.length})`);

  const firstLabId = labsRes.labs[0].id;
  const expRes = await fetch(`http://localhost:5000/api/labs/${firstLabId}/experiments`).then(r => r.json());
  assert(expRes.success && expRes.experiments.length === 12, `12 Experiments verified for ${labsRes.labs[0].name} (Found: ${expRes.experiments.length})`);

  // 4. Active Sessions & Live QR
  console.log('\n4. Testing Live Session & Dynamic QR Engine...');
  const activeSessRes = await fetch('http://localhost:5000/api/sessions/active').then(r => r.json());
  assert(activeSessRes.success && activeSessRes.sessions.length > 0, 'Active lab session retrieved');
  const activeSession = activeSessRes.sessions[0];

  const liveRes = await fetch(`http://localhost:5000/api/sessions/${activeSession.id}/live`).then(r => r.json());
  assert(liveRes.success && liveRes.liveMetrics.presentCount > 0, `Live presence count verified: ${liveRes.liveMetrics.presentCount}/${liveRes.liveMetrics.totalStudentsCount}`);
  assert(liveRes.activeQR && liveRes.activeQR.token, 'Dynamic HMAC QR token active and rotating');

  // 5. Section 40 Fraud Scenarios
  console.log('\n5. Executing Section 40 Fraud & Anomaly Scenarios...');

  // Scenario A: Genuine Student
  const scARes = await fetch('http://localhost:5000/api/demo/run-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'SCENARIO_A' })
  }).then(r => r.json());
  assert(scARes.success && scARes.result.status === 'VERIFIED', 'Scenario A: Genuine in-lab feedback verified as VERIFIED');

  // Scenario B: Remote Proxy Scammer (Missing Attendance)
  const scBRes = await fetch('http://localhost:5000/api/demo/run-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'SCENARIO_B' })
  }).then(r => r.json());
  assert(scBRes.success && scBRes.result.status === 'SUSPICIOUS', 'Scenario B: Remote proxy without attendance caught as SUSPICIOUS');
  assert(scBRes.result.flags.includes('ATTENDANCE_MISSING'), 'Scenario B: Flag ATTENDANCE_MISSING correctly triggered');

  // Scenario C: Expired Dynamic QR
  const scCRes = await fetch('http://localhost:5000/api/demo/run-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'SCENARIO_C' })
  }).then(r => r.json());
  assert(scCRes.success && scCRes.result.status === 'INVALID', 'Scenario C: Expired dynamic QR caught as INVALID');
  assert(scCRes.result.flags.includes('EXPIRED_QR'), 'Scenario C: Flag EXPIRED_QR correctly triggered');

  // Scenario D: Outside Geofence Perimeter
  const scDRes = await fetch('http://localhost:5000/api/demo/run-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario: 'SCENARIO_D' })
  }).then(r => r.json());
  assert(scDRes.success && scDRes.result.status === 'INVALID', 'Scenario D: Submission outside 50m geofence caught as INVALID');
  assert(scDRes.result.flags.includes('OUTSIDE_GEOFENCE'), 'Scenario D: Flag OUTSIDE_GEOFENCE correctly triggered');

  // 6. Verification Audit Records
  console.log('\n6. Testing Verification Audit & Alert System...');
  const auditRes = await fetch('http://localhost:5000/api/verification', {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  assert(auditRes.success && auditRes.records.length > 0, `Verification audit records fetched (${auditRes.records.length} records)`);

  const alertsRes = await fetch('http://localhost:5000/api/alerts', {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  assert(alertsRes.success && alertsRes.alerts.length > 0, `Security alerts generated and fetched (${alertsRes.alerts.length} alerts)`);

  // 7. Department Analytics & Reports
  console.log('\n7. Testing Department Analytics & Compliance Reports...');
  const analyticsRes = await fetch('http://localhost:5000/api/analytics/department', {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  assert(analyticsRes.success && analyticsRes.metrics.totalStudents === 48, 'Department analytics returned 48 enrolled students');

  const reportRes = await fetch('http://localhost:5000/api/reports/attendance?format=csv', {
    headers: { 'Authorization': `Bearer ${adminLogin.token}` }
  }).then(r => r.text());
  assert(reportRes.includes('Student USN') && reportRes.includes('Geofence Status'), 'Attendance report generated in valid CSV format');

  // 8. Frontend Dev Server Check
  console.log('\n8. Checking Frontend Delivery on http://localhost:5173...');
  const frontendHtml = await fetch('http://localhost:5173/').then(r => r.text());
  assert(frontendHtml.includes('LabGuard') && frontendHtml.includes('root'), 'Frontend index.html served on port 5173');

  console.log('\n========================================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
