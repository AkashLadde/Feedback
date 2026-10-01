import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  Plus,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  Radio,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Navigation,
  RefreshCw,
  Layers,
  UserCheck,
  Compass,
  AlertCircle
} from 'lucide-react';

export const LaboratoriesManagementPage: React.FC = () => {
  const { user, setActiveTab, refreshTrigger } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('3'); // Default to 3rd semester!
  const [editLab, setEditLab] = useState<any | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for Create Lab
  const [newLabName, setNewLabName] = useState('');
  const [newLabCode, setNewLabCode] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newSemester, setNewSemester] = useState('3');
  const [newFacultyId, setNewFacultyId] = useState<string>('');
  const [newLat, setNewLat] = useState('12.971598');
  const [newLng, setNewLng] = useState('77.594562');
  const [newRadius, setNewRadius] = useState('50');
  const [submitting, setSubmitting] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const fetchFaculty = async () => {
    try {
      const res = await api.getFaculty();
      if (res.success) {
        setFacultyList(res.faculty || []);
        if (res.faculty?.length > 0 && !newFacultyId) {
          setNewFacultyId(String(res.faculty[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load faculty for labs:', err);
    }
  };

  const fetchLabs = async () => {
    try {
      setLoading(true);
      const res = await api.getLabs({
        semester: selectedSemester
      });
      if (res.success) setLabs(res.labs || []);
    } catch (err) {
      console.error('Failed to load labs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [refreshTrigger]);

  useEffect(() => {
    fetchLabs();
  }, [selectedSemester, refreshTrigger]);

  // Real-Time GPS Detection function
  const detectLiveGps = (target: 'CREATE' | 'EDIT') => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setGpsStatus('Acquiring high-precision GPS lock...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        if (target === 'CREATE') {
          setNewLat(lat.toFixed(6));
          setNewLng(lng.toFixed(6));
        } else if (editLab) {
          setEditLab({
            ...editLab,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          });
        }

        setGpsStatus(`📍 Real-time GPS Locked: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)} (Accuracy ±${accuracy}m)`);
        setDetectingGps(false);
      },
      (err) => {
        setGpsStatus(`⚠️ GPS Error: ${err.message}. Using default campus coordinates.`);
        setDetectingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.createLab({
        name: newLabName.trim(),
        code: newLabCode.trim().toUpperCase(),
        room_number: newRoomNumber.trim(),
        latitude: parseFloat(newLat),
        longitude: parseFloat(newLng),
        geofence_radius: parseFloat(newRadius),
        semester: parseInt(newSemester, 10),
        faculty_id: newFacultyId ? parseInt(newFacultyId, 10) : null
      });

      if (res.success) {
        setCreateModalOpen(false);
        setNewLabName('');
        setNewLabCode('');
        setNewRoomNumber('');
        setGpsStatus(null);
        await fetchLabs();
      }
    } catch (err: any) {
      alert('Failed to create laboratory: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLab) return;
    try {
      setSubmitting(true);
      await api.updateLab(editLab.id, {
        name: editLab.name,
        room_number: editLab.room_number,
        latitude: parseFloat(editLab.latitude),
        longitude: parseFloat(editLab.longitude),
        geofence_radius: parseFloat(editLab.geofence_radius),
        semester: parseInt(editLab.semester, 10),
        faculty_id: editLab.faculty_id ? parseInt(editLab.faculty_id, 10) : null,
        status: editLab.status
      });
      setEditLab(null);
      setGpsStatus(null);
      await fetchLabs();
    } catch (err: any) {
      alert('Failed to update laboratory: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLab = async (id: number, labName: string) => {
    if (!confirm(`Are you sure you want to delete laboratory "${labName}"? All syllabus experiments will also be removed.`)) return;
    try {
      const res = await api.deleteLab(id);
      if (res.success) {
        await fetchLabs();
      }
    } catch (err: any) {
      alert('Failed to delete lab: ' + err.message);
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HOD';

  const semesterOptions = [
    { value: 'ALL', label: 'All Semesters' },
    { value: '1', label: '1st Semester' },
    { value: '2', label: '2nd Semester' },
    { value: '3', label: '3rd Semester' },
    { value: '4', label: '4th Semester' },
    { value: '5', label: '5th Semester' },
    { value: '6', label: '6th Semester' },
    { value: '7', label: '7th Semester' },
    { value: '8', label: '8th Semester' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-cyan-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Laboratory Registry & Real-Time Geofence Provisioning
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of IoT and Cybersecurity Including Blockchain Technology • Semester-wise labs & real-time physical perimeter enforcement
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setNewSemester(selectedSemester !== 'ALL' ? selectedSemester : '3');
              setGpsStatus(null);
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Laboratory</span>
          </button>
        )}
      </div>

      {/* Semester Filter Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Layers className="w-4 h-4 text-cyan-600" />
            <span>Select Semester:</span>
          </div>

          <div className="text-xs text-slate-500">
            {selectedSemester === 'ALL' ? (
              <span>Showing laboratories across all semesters</span>
            ) : (
              <span className="font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                Filtered strictly to: <strong>Semester {selectedSemester}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Semester Buttons / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {semesterOptions.map((opt) => {
            const isSelected = selectedSemester === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelectedSemester(opt.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-orange-500 text-white shadow-sm ring-2 ring-cyan-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="bg-orange-600 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                    {labs.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Laboratories Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-cyan-100 shadow-sm">
          <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading laboratories for {selectedSemester !== 'ALL' ? `Semester ${selectedSemester}` : 'department'}...</span>
        </div>
      ) : labs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cyan-100 shadow-sm text-center space-y-4">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">
            No Laboratories Found for {selectedSemester !== 'ALL' ? `Semester ${selectedSemester}` : 'the Selected Semester'}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no laboratories configured for {selectedSemester !== 'ALL' ? `Semester ${selectedSemester}` : 'this selection'}. Click "Add New Laboratory" to register a lab with physical coordinates and geofencing.
          </p>
          {isAdmin && (
            <button
              onClick={() => {
                setNewSemester(selectedSemester !== 'ALL' ? selectedSemester : '3');
                setGpsStatus(null);
                setCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add Laboratory for {selectedSemester !== 'ALL' ? `Semester ${selectedSemester}` : 'Department'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labs.map((lab) => (
            <div
              key={lab.id}
              className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-5 flex flex-col justify-between hover:border-cyan-300 hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                        {lab.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Semester {lab.semester}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {lab.status}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1.5 group-hover:text-cyan-600 transition-colors">
                      {lab.name}
                    </h2>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditLab({ ...lab });
                          setGpsStatus(null);
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                        title="Configure Geofencing & Location"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLab(lab.id, lab.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Laboratory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div>Room / Facility: <strong className="text-slate-800">{lab.room_number}</strong></div>
                  <div>Faculty In-Charge: <strong className="text-slate-800">{lab.faculty_name || 'Department Faculty'}</strong></div>
                </div>

                {/* Real-time Geofence specs */}
                <div className="p-3 bg-cyan-50/40 rounded-xl border border-cyan-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 font-semibold">
                    <span className="flex items-center gap-1.5 text-cyan-600">
                      <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span>Geofence Boundary:</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-cyan-100">
                      {lab.geofence_radius} meters
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Center GPS:</span>
                    <span className="font-bold text-slate-700">
                      {Number(lab.latitude).toFixed(5)}, {Number(lab.longitude).toFixed(5)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>12 Syllabus Experiments</span>
                </span>

                <button
                  onClick={() => setActiveTab('experiments')}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
                >
                  <span>View Syllabus</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Geofence Modal */}
      {editLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cyan-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Configure Laboratory & Geofence</h3>
                <p className="text-xs text-slate-500">{editLab.name} ({editLab.code})</p>
              </div>
              <button onClick={() => setEditLab(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* GPS status feedback */}
            {gpsStatus && (
              <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-xl text-xs font-medium animate-fadeIn">
                {gpsStatus}
              </div>
            )}

            <form onSubmit={handleUpdateLab} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Laboratory Name</label>
                <input
                  type="text"
                  required
                  value={editLab.name}
                  onChange={(e) => setEditLab({ ...editLab, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                <select
                  value={editLab.semester}
                  onChange={(e) => setEditLab({ ...editLab, semester: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Semester {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Wing</label>
                  <input
                    type="text"
                    required
                    value={editLab.room_number}
                    onChange={(e) => setEditLab({ ...editLab, room_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty In-Charge</label>
                  <select
                    value={editLab.faculty_id || ''}
                    onChange={(e) => setEditLab({ ...editLab, faculty_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value="">-- Select Teacher --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-Time Geofence Controls */}
              <div className="p-3 bg-cyan-50/40 rounded-xl border border-cyan-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-cyan-600" />
                    <span>Real-Time Geofence Coordinates</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => detectLiveGps('EDIT')}
                    disabled={detectingGps}
                    className="px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Compass className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                    <span>{detectingGps ? 'Detecting GPS...' : '📍 Detect My Location'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editLab.latitude}
                      onChange={(e) => setEditLab({ ...editLab, latitude: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editLab.longitude}
                      onChange={(e) => setEditLab({ ...editLab, longitude: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-600 text-[11px]">Perimeter Radius (Meters)</label>
                    <span className="font-mono font-bold text-cyan-700 text-xs">{editLab.geofence_radius}m</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="200"
                    step="5"
                    value={editLab.geofence_radius}
                    onChange={(e) => setEditLab({ ...editLab, geofence_radius: e.target.value })}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>15m (Strict Room)</span>
                    <span>25m (Recommended)</span>
                    <span>200m (Campus Wing)</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditLab(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg font-bold shadow"
                >
                  {submitting ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Lab Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-cyan-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Provision New Laboratory</h3>
                <p className="text-xs text-slate-500">Configure lab syllabus, room location, and live geofence perimeter</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {/* GPS status feedback */}
            {gpsStatus && (
              <div className="p-3 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-xl text-xs font-medium animate-fadeIn">
                {gpsStatus}
              </div>
            )}

            <form onSubmit={handleCreateLab} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Laboratory Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IoT Security & Microcontroller Systems Lab"
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lab Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IOT-301"
                    value={newLabCode}
                    onChange={(e) => setNewLabCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Semester {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Wing Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Lab 301 (IoT Wing)"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty In-Charge</label>
                  <select
                    value={newFacultyId}
                    onChange={(e) => setNewFacultyId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  >
                    <option value="">-- Select Faculty In-Charge --</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Geofencing Capture Card */}
              <div className="p-3.5 bg-cyan-50/40 rounded-xl border border-cyan-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-cyan-600" />
                      <span>Physical Geofence Coordinates</span>
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Stand inside the lab room to capture exact GPS coordinates
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => detectLiveGps('CREATE')}
                    disabled={detectingGps}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Compass className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                    <span>{detectingGps ? 'Locating...' : '📍 Detect Live GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Center Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newLat}
                      onChange={(e) => setNewLat(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Center Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newLng}
                      onChange={(e) => setNewLng(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 font-mono text-xs bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-600 text-[11px]">Geofence Radius Limit</label>
                    <span className="font-mono font-bold text-cyan-700 text-xs">{newRadius} meters</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="200"
                    step="5"
                    value={newRadius}
                    onChange={(e) => setNewRadius(e.target.value)}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>15m (Strict Room)</span>
                    <span>25m (Recommended)</span>
                    <span>200m (Campus Wing)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cyan-50 text-cyan-800 rounded-xl text-[11px] leading-relaxed border border-cyan-100">
                ✅ System will automatically generate 12 syllabus practical experiments for this new laboratory.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white rounded-lg font-bold shadow"
                >
                  {submitting ? 'Creating Lab...' : 'Create Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
