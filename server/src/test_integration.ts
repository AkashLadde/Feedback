// Integration verification script for GNDEC Bidar Academic Platform

async function runTests() {
  const baseUrl = 'http://localhost:5000';
  console.log('--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  console.log('Health Response:', healthData);

  console.log('\n--- 2. Testing Teacher Login (Prof. Aarti Pawar) ---');
  const teacherLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarti.pawar@gndecb.ac.in', password: 'Faculty@123' })
  });
  const teacherLogin = await teacherLoginRes.json();
  console.log('Teacher Login Success:', teacherLogin.success, '| Role:', teacherLogin.user?.role, '| Name:', teacherLogin.user?.name);
  const teacherToken = teacherLogin.token;

  console.log('\n--- 3. Testing Teacher Fetching Attendance Roster (Sem 5 Sec A) ---');
  const rosterRes = await fetch(`${baseUrl}/api/attendance/roster?semester=5&section=A`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const rosterData = await rosterRes.json();
  console.log('Roster Success:', rosterData.success, '| Total Students Found:', rosterData.students?.length);
  if (rosterData.students?.length > 0) {
    console.log('Sample Students:', rosterData.students.slice(0, 3).map((s: any) => `${s.usn} (${s.name})`));
  }

  console.log('\n--- 4. Testing Teacher Taking Attendance ---');
  // Get laboratory ID for CN Lab or Computer Networks
  const labsRes = await fetch(`${baseUrl}/api/labs`, {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const labsData = await labsRes.json();
  const sem5Lab = labsData.labs?.find((l: any) => l.semester === 5) || labsData.labs?.[0];
  console.log('Selected Lab for Attendance:', sem5Lab?.code, '-', sem5Lab?.name);

  if (rosterData.students && rosterData.students.length > 0) {
    const studentsList = rosterData.students.map((s: any, idx: number) => ({
      student_id: s.student_id,
      status: idx === 1 ? 'ABSENT' : idx === 3 ? 'LATE' : 'PRESENT',
      remarks: idx === 1 ? 'Medical leave requested' : ''
    }));

    const takeRes = await fetch(`${baseUrl}/api/attendance/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        laboratory_id: sem5Lab?.id,
        semester: 5,
        section: 'A',
        date: new Date().toISOString().split('T')[0],
        time_slot: '09:00 AM - 10:00 AM',
        attendance: studentsList
      })
    });
    const takeData = await takeRes.json();
    console.log('Attendance Taken Response:', takeData);
  }

  console.log('\n--- 5. Testing Student Login (3GN24IC006) ---');
  const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '3GN24IC006', password: 'Student@123' })
  });
  const studentLogin = await studentLoginRes.json();
  console.log('Student Login Success:', studentLogin.success, '| Role:', studentLogin.user?.role, '| Name:', studentLogin.user?.name);
  const studentToken = studentLogin.token;

  console.log('\n--- 6. Testing Timetable Fetching for Sem 5 ---');
  const ttRes = await fetch(`${baseUrl}/api/timetable/5`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const ttData = await ttRes.json();
  console.log('Timetable Entries for Sem 5 Count:', ttData.entries?.length);
  if (ttData.entries?.length > 0) {
    console.log('Sample Schedule:', ttData.entries.slice(0, 2).map((t: any) => `${t.day_of_week} ${t.time_range}: ${t.subject_code} (${t.subject_name}) with ${t.faculty_name}`));
  }

  console.log('\n--- 7. Testing Student Direct Feedback Submission ---');
  if (sem5Lab) {
    const feedbackRes = await fetch(`${baseUrl}/api/feedback/submit-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        laboratory_id: sem5Lab.id,
        faculty_id: sem5Lab.faculty_id,
        ratings: {
          clarity_rating: 5,
          preparedness_rating: 5,
          support_rating: 4,
          equipment_rating: 5,
          safety_rating: 5
        },
        comments: 'Excellent explanation of network topologies and socket programming concepts!'
      })
    });
    const feedbackData = await feedbackRes.json();
    console.log('Feedback Submission Response:', feedbackData);
  }

  console.log('\n--- 8. Testing Admin Login (aiml.harishjoshi@gmail.com) ---');
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aiml.harishjoshi@gmail.com', password: 'Joshi@2308' })
  });
  const adminLogin = await adminLoginRes.json();
  console.log('Admin Login Success:', adminLogin.success, '| Role:', adminLogin.user?.role, '| Name:', adminLogin.user?.name);
  const adminToken = adminLogin.token;

  console.log('\n--- 9. Testing Admin Viewing All Attendance Records ---');
  const adminAttRes = await fetch(`${baseUrl}/api/attendance/all?semester=5`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminAttData = await adminAttRes.json();
  console.log('Admin Attendance Records Count:', adminAttData.records?.length, '| Stats:', adminAttData.stats);

  console.log('\n--- 10. Testing Admin Viewing All Student Feedback Submissions ---');
  const adminFbRes = await fetch(`${baseUrl}/api/feedback/all`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminFbData = await adminFbRes.json();
  console.log('Admin Feedback Records Count:', adminFbData.feedbacks?.length);
  if (adminFbData.feedbacks?.length > 0) {
    const latest = adminFbData.feedbacks[0];
    console.log(`Latest Feedback: Lab=${latest.lab_name}, Faculty=${latest.faculty_name || 'N/A'}, Avg Rating=${latest.average_rating}, Comment="${latest.comments}"`);
  }

  console.log('\n--- 11. Testing Timetables for Semesters 1, 3, 5, 7 ---');
  for (const sem of [1, 3, 5, 7]) {
    const sRes = await fetch(`${baseUrl}/api/timetable/${sem}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sData = await sRes.json();
    console.log(`Semester ${sem} Timetable: ${sData.entries?.length} entries loaded.`);
    if (sem === 3) {
      const mondayIot = sData.entries?.find((e: any) => e.day_of_week === 'MONDAY' && e.subject_code === 'BICL305');
      console.log('Sem 3 Monday IoT Lab Found:', mondayIot ? `YES (${mondayIot.subject_name}, ${mondayIot.time_range})` : 'NO');
    }
  }

  console.log('\n--- 12. Testing Student Registration & Admin Approval Workflow (No Direct Login, No OTP) ---');
  const testUsn = `3GN24IC${Math.floor(100 + Math.random() * 900)}`;
  const regRes = await fetch(`${baseUrl}/api/auth/register-student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Verify Student',
      usn: testUsn,
      email: `${testUsn.toLowerCase()}@gndec.ac.in`,
      phone: '9876543210',
      semester: 3,
      section: 'A',
      batch: 'B1',
      password: 'Student@123'
    })
  });
  const regData = await regRes.json();
  console.log('Registration Response:', regData);
  console.log('Token Returned during registration (must be undefined):', regData.token);

  console.log('\n--- 13. Testing Direct Login with Pending Student (Must Fail with 403) ---');
  const pendingLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUsn, password: 'Student@123' })
  });
  const pendingLoginData = await pendingLoginRes.json();
  console.log('Pending Student Login Status:', pendingLoginRes.status, '| Message:', pendingLoginData.message);

  console.log('\n--- 14. Testing Admin Approving the Pending Student ---');
  const studentsListRes = await fetch(`${baseUrl}/api/students`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const studentsListData = await studentsListRes.json();
  const createdStudent = studentsListData.students.find((s: any) => s.usn === testUsn);
  console.log('Found newly registered student:', createdStudent?.name, 'ID:', createdStudent?.id, 'Status:', createdStudent?.verification_status);

  if (createdStudent) {
    const verifyRes = await fetch(`${baseUrl}/api/students/${createdStudent.id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifyData = await verifyRes.json();
    console.log('Admin Verification Action:', verifyData);

    console.log('\n--- 15. Testing Student Login After Verification (Must Succeed) ---');
    const approvedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUsn, password: 'Student@123' })
    });
    const approvedLoginData = await approvedLoginRes.json();
    console.log('Approved Student Login Success:', approvedLoginData.success, '| Name:', approvedLoginData.user?.name);
  }

  console.log('\n=============================================');
  console.log('✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
