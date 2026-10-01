# LabGuard: Smart Laboratory Attendance & Feedback Verification System

**Department of IoT and Cybersecurity Including Blockchain Technology**  
*Faculty of Engineering & Technology*

---

## 1. Executive Overview

**LabGuard** is an enterprise-grade academic laboratory management and anti-fraud verification platform designed to ensure genuine student presence and eliminate proxy/remote laboratory feedback submission. 

### The Core Problem Solved
In conventional laboratory workflows, students who miss a laboratory practical frequently obtain a photo or link of the feedback QR code from a friend via messaging apps (e.g. WhatsApp, Telegram) and submit feedback remotely from their hostel or home. 

**LabGuard completely eliminates this fraud pattern** by uniting three cryptographically coupled pillars:
1. **Physical Geofencing**: Precise 50-meter spherical boundary enforcement around laboratory coordinates with low-accuracy and spoof-jump detection.
2. **Dynamic Short-Lived QR Tokens**: Cryptographically signed HMAC-SHA256 tokens that rotate every 45 seconds, strictly bound to the active session, section, and experiment.
3. **Automated Attendance-Feedback Matching Engine**: Evaluates every feedback submission through a **10-rule verification engine** that compares physical check-in timestamps, GPS coordinates, spatial displacement velocity, and section enrollments before marking a feedback record as genuine.

---

## 2. Architecture & Technology Stack

```
Frontend (React 19, TypeScript, Tailwind CSS, Vite)
   ↓ [Bearer JWT / REST API via HTTP / JSON]
Express.js Backend (Node.js, TypeScript, HMAC-SHA256)
   ↓
Verification Engine (10 Anomaly & Fraud Rules)
   ↓
SQLite Relational Database (Foreign Key Constraints, WAL Mode)
   ↓
Real-Time Alert Dispatcher & Analytical Aggregators
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend**: Node.js v24, Express, TypeScript, `node:sqlite` (zero-dependency native relational SQLite with synchronous WAL performance and foreign key enforcement).
- **Security & Cryptography**: JSON Web Tokens (12h expiration), HMAC-SHA256 dynamic token signatures, Haversine spherical distance calculation, spatial velocity jump detection.
- **Design System**: Strict bright enterprise theme (Blue `#2563EB`, Cyan `#06B6D4`, Slate `#1E293B`, White `#FFFFFF`) with clear status indicators (Green, Yellow, Red).

---

## 3. Database Schema

The normalized relational database schema resides in `server/src/models/db.ts`:

- `users`: Core authentication identity (`id`, `name`, `email`, `password_hash`, `role`, `status`, `created_at`).
- `students`: Academic identity (`id`, `user_id`, `usn`, `semester`, `section`, `batch`, `department`, `academic_year`).
- `faculty`: Instructor profile (`id`, `user_id`, `employee_id`, `designation`, `specialization`).
- `laboratories`: Laboratory records (`id`, `name`, `code`, `semester`, `room_number`, `latitude`, `longitude`, `geofence_radius`, `status`).
- `experiments`: 12 experiments per lab (`id`, `laboratory_id`, `experiment_number`, `title`, `description`, `objectives`, `tools_required`).
- `lab_sessions`: Active & historical sessions (`id`, `session_code`, `laboratory_id`, `faculty_id`, `experiment_id`, `semester`, `section`, `date`, `status`, `qr_refresh_interval`).
- `attendance`: Physical presence check-in (`id`, `student_id`, `lab_session_id`, `experiment_id`, `latitude`, `longitude`, `accuracy`, `distance_to_lab`, `geofence_status`, `verification_status`).
- `qr_sessions`: Dynamic tokens (`id`, `lab_session_id`, `token_hash`, `plain_token`, `expires_at`, `status`).
- `feedback`: Student evaluation (`id`, `student_id`, `lab_session_id`, `experiment_id`, `teaching_basics`, `hands_on`, `viva`, `understanding`, `comments`, `latitude`, `longitude`, `distance_to_lab`, `qr_token_used`, `verification_status`, `flags`).
- `verification_events`: Detailed rule violation audit trail (`id`, `student_id`, `lab_session_id`, `feedback_id`, `event_type`, `severity`, `rule_code`, `reason`, `payload_details`).
- `alerts`: Security notifications (`id`, `type`, `severity`, `student_id`, `lab_session_id`, `message`, `status`, `resolution_notes`, `resolved_by`).
- `audit_logs`: Administrative security log (`id`, `user_id`, `user_email`, `user_role`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`).

---

## 4. The 10-Rule Verification Engine

| Rule Code | Trigger Condition | Severity | Resulting Status |
| :--- | :--- | :--- | :--- |
| **`ATTENDANCE_MISSING`** | Feedback submitted with no prior physical attendance record | **HIGH** | `SUSPICIOUS` / `PENDING REVIEW` |
| **`OUTSIDE_GEOFENCE`** | Device coordinates > 50m from lab center | **HIGH** | `INVALID` |
| **`EXPIRED_QR`** | Dynamic QR token age > 45 seconds | **MEDIUM** | `INVALID` |
| **`LAB_MISMATCH`** | Token lab does not match active session | **HIGH** | `MISMATCH` |
| **`EXPERIMENT_MISMATCH`** | Token experiment does not match active syllabus item | **MEDIUM** | `MISMATCH` |
| **`SECTION_MISMATCH`** | Student registered in Sec B attempts Sec A session | **MEDIUM** | `MISMATCH` |
| **`DUPLICATE_SUBMISSION`**| Student attempts second feedback in same session | **MEDIUM** | `INVALID` |
| **`LOCATION_UNCERTAIN`** | GPS horizontal accuracy error > 100 meters | **LOW** | `PENDING REVIEW` |
| **`LOCATION_ANOMALY`** | Spatial jump > 15 m/s from attendance coordinate | **HIGH** | `SUSPICIOUS` |
| **`REPEATED_VERIFICATION_FAILURE`** | Multiple security flags logged in past 7 days | **CRITICAL**| `PENDING REVIEW` |

---

## 5. Live Demonstration Scenarios (Section 40)

An interactive demonstration suite is accessible via the top **⚡ Run Fraud Scenarios** button:

1. **Scenario A: Genuine In-Lab Feedback**
   - **Persona**: Rahul Verma (`1RV23CY001`)
   - **Condition**: Physically checked into VAPT Lab Exp 7, inside 50m geofence, scans valid QR.
   - **Engine Decision**: `VERIFIED` (Celebration confetti rendered).
2. **Scenario B: Remote Proxy Feedback (The Forwarded Link Scam)**
   - **Persona**: Pooja Kulkarni (`1RV23CY002`)
   - **Condition**: Absent from class; classmate forwards QR code photo via WhatsApp. Pooja attempts feedback from her hostel room.
   - **Engine Decision**: Caught by Rule 1 `ATTENDANCE_MISSING`. Status: `SUSPICIOUS` / `REVIEW REQUIRED`. Alert automatically dispatched to HOD dashboard.
3. **Scenario C: Expired Dynamic QR Token**
   - **Persona**: Amit Shah (`1RV23CY003`)
   - **Condition**: Present in class, but attempts submission using a cached or stale QR code.
   - **Engine Decision**: Caught by Rule 3 `EXPIRED_QR`. Status: `INVALID`.
4. **Scenario D: Outside Geofence Perimeter**
   - **Persona**: Sneha Reddy (`1RV23CY004`)
   - **Condition**: Attended class, but walked 420 meters away to the campus cafeteria to submit feedback.
   - **Engine Decision**: Caught by Rule 2 `OUTSIDE_GEOFENCE`. Status: `INVALID`.

---

## 6. User Roles & Academic Authentication

| Role | Description | Access Method |
| :--- | :--- | :--- |
| **Head of Department (HOD)** | Departmental administration, syllabus verification, lab sessions oversight | Institutional Email (`harish.joshi@gndec.ac.in`) |
| **Faculty / Instructor** | Session control, manual/roster attendance taking, timetable review | Institutional Email (`aarti.pawar@gndec.ac.in`, etc.) |
| **Enrolled Students** | Physical geofence check-in, dynamic QR scanning, verified feedback submission | Self-registration with USN (`3GN...`) & Email |

---

## 7. Setup & Execution Instructions

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Quick Start
1. **Install Dependencies**:
   ```bash
   npm run install:all
   ```
2. **Seed Initial Database**:
   ```bash
   npm run seed
   ```
3. **Launch Full-Stack Application**:
   ```bash
   npm run dev
   ```
   - **Frontend UI**: [http://localhost:5173/](http://localhost:5173/)
   - **Backend API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Running Automated Test Suite
To execute the 21-point automated verification and fraud test suite:
```bash
node test_suite.js
```

---

## 8. Export & Compliance Reports
- **Attendance Report**: Available via UI with 1-click CSV download (`/api/reports/attendance?format=csv`).
- **Verification Audit Report**: Available with deep status filters and CSV export (`/api/reports/verification?format=csv`).
- **Experiment Completion Report**: Tracks syllabus completion rates across all 7 laboratories and 84 experiments.
