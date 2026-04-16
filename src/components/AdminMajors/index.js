import React, { useState, useEffect } from 'react';
import { getAllMajors, saveMajor, deleteMajor } from '../../services/db';

const EMPTY_REQUIREMENTS = {
  major_requirements: [],
  core_requirements: []
};

function AdminMajors() {
  const [majors, setMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState(null);
  
  // Form State
  const [majorId, setMajorId] = useState('');
  const [majorName, setMajorName] = useState('');
  const [requirementsJson, setRequirementsJson] = useState(JSON.stringify(EMPTY_REQUIREMENTS, null, 2));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMajors();
  }, []);

  async function loadMajors() {
    setLoading(true);
    const data = await getAllMajors();
    setMajors(data || []);
    setLoading(false);
  }

  const handleSelectMajor = (major) => {
    setSelectedMajor(major);
    setMajorId(major.id);
    setMajorName(major.name);
    setRequirementsJson(JSON.stringify(major.requirements || EMPTY_REQUIREMENTS, null, 2));
    setError('');
    setSuccess('');
  };

  const handleCreateNew = () => {
    setSelectedMajor(null);
    setMajorId('');
    setMajorName('');
    setRequirementsJson(JSON.stringify(EMPTY_REQUIREMENTS, null, 2));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!majorId) {
      setError('Major ID is required (e.g., "CSCI").');
      return;
    }

    if (!majorName) {
      setError('Major Name is required (e.g., "Computer Science B.S.").');
      return;
    }

    let parsedRequirements = {};
    try {
      parsedRequirements = JSON.parse(requirementsJson);
    } catch (err) {
      setError('Invalid JSON in requirements. Please check for syntax errors.');
      return;
    }

    setLoading(true);
    const result = await saveMajor(majorId, {
      id: majorId,
      name: majorName,
      requirements: parsedRequirements
    });

    if (result) {
      setSuccess('Major saved successfully!');
      await loadMajors();
      if (!selectedMajor) {
        // If it was new, set it as selected
        setSelectedMajor(result[0] || result);
      }
    } else {
      setError('Failed to save major to database.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedMajor) return;
    const confirm = window.confirm(`Are you sure you want to delete major ${selectedMajor.id}?`);
    if (!confirm) return;

    setLoading(true);
    const result = await deleteMajor(selectedMajor.id);
    if (result) {
      setSuccess('Major deleted successfully!');
      handleCreateNew();
      await loadMajors();
    } else {
      setError('Failed to delete major.');
    }
    setLoading(false);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(requirementsJson);
      setRequirementsJson(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err) {
      setError('Cannot format: Invalid JSON.');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto w-full flex gap-8">
        
        {/* Left Side: List of Majors */}
        <div className="w-1/3 flex flex-col gap-4">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Admin: Majors</h2>
          <button 
            onClick={handleCreateNew}
            className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
          >
            + Create New Major
          </button>
          
          <div className="flex-1 overflow-y-auto bg-surface-container-low rounded-xl border border-outline-variant/40 p-2 space-y-2">
            {majors.map(major => (
              <div 
                key={major.id}
                onClick={() => handleSelectMajor(major)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedMajor?.id === major.id ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-white hover:border-primary/50'}`}
              >
                <p className="font-bold text-sm text-on-surface">{major.id}</p>
                <p className="text-xs text-stone-500">{major.name}</p>
              </div>
            ))}
            {majors.length === 0 && !loading && (
              <p className="p-4 text-xs text-stone-500 text-center">No majors found.</p>
            )}
            {loading && !selectedMajor && (
              <p className="p-4 text-xs text-stone-500 text-center">Loading majors...</p>
            )}
          </div>
        </div>

        {/* Right Side: Editor */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-outline-variant/40 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-on-surface">
              {selectedMajor ? `Edit Major: ${selectedMajor.id}` : 'Create New Major'}
            </h3>
            {selectedMajor && (
              <button 
                onClick={handleDelete}
                className="text-error text-sm font-bold hover:underline"
              >
                Delete Major
              </button>
            )}
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm border border-green-200">{success}</div>}

          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="block text-xs font-bold text-stone-500 mb-1">Major ID</label>
                <input 
                  type="text" 
                  value={majorId}
                  onChange={(e) => setMajorId(e.target.value.toUpperCase())}
                  disabled={!!selectedMajor}
                  placeholder="e.g., MATH"
                  className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg text-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-500 mb-1">Major Name</label>
                <input 
                  type="text" 
                  value={majorName}
                  onChange={(e) => setMajorName(e.target.value)}
                  placeholder="e.g., Mathematics B.S."
                  className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg text-sm focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-stone-500">Requirements (JSON)</label>
                <button onClick={handleFormatJson} className="text-xs text-primary font-bold hover:underline">Format JSON</button>
              </div>
              <textarea 
                value={requirementsJson}
                onChange={(e) => setRequirementsJson(e.target.value)}
                className="w-full flex-1 px-3 py-2 border border-outline-variant/60 rounded-lg text-sm font-mono focus:ring-primary focus:border-primary"
                style={{ minHeight: '300px' }}
              />
              <p className="text-[10px] text-stone-400 mt-2">
                Tip: Copy structure from an existing major. Ensure proper JSON syntax.
              </p>
            </div>

            <div className="pt-4 border-t border-outline-variant/40 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Major'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMajors;
