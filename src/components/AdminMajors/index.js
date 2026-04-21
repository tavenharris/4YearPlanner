import React, { useState, useEffect } from 'react';
import { getAllMajors, saveMajor, deleteMajor, getAllMinors, saveMinor, deleteMinor } from '../../services/db';

const EMPTY_REQUIREMENTS = {
  major_requirements: [],
  core_requirements: []
};

const EMPTY_MINOR_REQUIREMENTS = {
  minor_requirements: []
};

function AdminMajors() {
  const [activeTab, setActiveTab] = useState('majors'); // 'majors' or 'minors'
  
  const [majors, setMajors] = useState([]);
  const [minors, setMinors] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Form State
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [requirementsJson, setRequirementsJson] = useState(JSON.stringify(EMPTY_REQUIREMENTS, null, 2));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'majors') {
      loadMajors();
    } else {
      loadMinors();
    }
  }, [activeTab]);

  async function loadMajors() {
    setLoading(true);
    const data = await getAllMajors();
    setMajors(data || []);
    setLoading(false);
  }

  async function loadMinors() {
    setLoading(true);
    const data = await getAllMinors();
    setMinors(data || []);
    setLoading(false);
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    handleCreateNew(tab);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setItemId(item.id);
    setItemName(item.name);
    const emptyReqs = activeTab === 'majors' ? EMPTY_REQUIREMENTS : EMPTY_MINOR_REQUIREMENTS;
    setRequirementsJson(JSON.stringify(item.requirements || emptyReqs, null, 2));
    setError('');
    setSuccess('');
  };

  const handleCreateNew = (tab = activeTab) => {
    setSelectedItem(null);
    setItemId('');
    setItemName('');
    const emptyReqs = tab === 'majors' ? EMPTY_REQUIREMENTS : EMPTY_MINOR_REQUIREMENTS;
    setRequirementsJson(JSON.stringify(emptyReqs, null, 2));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    const isMajor = activeTab === 'majors';
    const typeName = isMajor ? 'Major' : 'Minor';
    
    if (!itemId) {
      setError(`${typeName} ID is required (e.g., "${isMajor ? 'CSCI' : 'MATH'}").`);
      return;
    }

    if (!itemName) {
      setError(`${typeName} Name is required.`);
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
    const dataToSave = {
      id: itemId,
      name: itemName,
      requirements: parsedRequirements
    };
    
    let result;
    if (isMajor) {
      result = await saveMajor(itemId, dataToSave);
    } else {
      result = await saveMinor(itemId, dataToSave);
    }

    if (result) {
      setSuccess(`${typeName} saved successfully!`);
      if (isMajor) {
        await loadMajors();
      } else {
        await loadMinors();
      }
      if (!selectedItem) {
        // If it was new, set it as selected
        setSelectedItem(result[0] || result);
      }
    } else {
      setError(`Failed to save ${typeName.toLowerCase()} to database.`);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const isMajor = activeTab === 'majors';
    const typeName = isMajor ? 'major' : 'minor';
    
    const confirm = window.confirm(`Are you sure you want to delete ${typeName} ${selectedItem.id}?`);
    if (!confirm) return;

    setLoading(true);
    let result;
    if (isMajor) {
      result = await deleteMajor(selectedItem.id);
    } else {
      result = await deleteMinor(selectedItem.id);
    }
    
    if (result) {
      setSuccess(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} deleted successfully!`);
      handleCreateNew();
      if (isMajor) {
        await loadMajors();
      } else {
        await loadMinors();
      }
    } else {
      setError(`Failed to delete ${typeName}.`);
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

  const items = activeTab === 'majors' ? majors : minors;
  const isMajor = activeTab === 'majors';
  const typeName = isMajor ? 'Major' : 'Minor';

  return (
    <div className="flex-1 flex overflow-hidden p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto w-full flex gap-8">
        
        {/* Left Side: List of Items */}
        <div className="w-1/3 flex flex-col gap-4">
          <h2 className="text-2xl font-headline font-bold text-on-surface">Admin: Programs</h2>
          
          <div className="flex bg-surface-container-low rounded-lg p-1">
            <button
              onClick={() => handleTabChange('majors')}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'majors' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Majors
            </button>
            <button
              onClick={() => handleTabChange('minors')}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === 'minors' ? 'bg-white shadow-sm text-primary' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Minors
            </button>
          </div>

          <button 
            onClick={() => handleCreateNew(activeTab)}
            className="w-full bg-primary text-white py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
          >
            + Create New {typeName}
          </button>
          
          <div className="flex-1 overflow-y-auto bg-surface-container-low rounded-xl border border-outline-variant/40 p-2 space-y-2">
            {items.map(item => (
              <div 
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedItem?.id === item.id ? 'border-primary bg-primary/10' : 'border-outline-variant/40 bg-white hover:border-primary/50'}`}
              >
                <p className="font-bold text-sm text-on-surface">{item.id}</p>
                <p className="text-xs text-stone-500">{item.name}</p>
              </div>
            ))}
            {items.length === 0 && !loading && (
              <p className="p-4 text-xs text-stone-500 text-center">No {typeName.toLowerCase()}s found.</p>
            )}
            {loading && !selectedItem && (
              <p className="p-4 text-xs text-stone-500 text-center">Loading {typeName.toLowerCase()}s...</p>
            )}
          </div>
        </div>

        {/* Right Side: Editor */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-outline-variant/40 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-on-surface">
              {selectedItem ? `Edit ${typeName}: ${selectedItem.id}` : `Create New ${typeName}`}
            </h3>
            {selectedItem && (
              <button 
                onClick={handleDelete}
                className="text-error text-sm font-bold hover:underline"
              >
                Delete {typeName}
              </button>
            )}
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm border border-green-200">{success}</div>}

          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="block text-xs font-bold text-stone-500 mb-1">{typeName} ID</label>
                <input 
                  type="text" 
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value.toUpperCase())}
                  disabled={!!selectedItem}
                  placeholder={`e.g., ${isMajor ? 'MATH' : 'HIST'}`}
                  className="w-full px-3 py-2 border border-outline-variant/60 rounded-lg text-sm focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-500 mb-1">{typeName} Name</label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder={`e.g., ${isMajor ? 'Mathematics B.S.' : 'History Minor'}`}
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
                Tip: Copy structure from an existing {typeName.toLowerCase()}. Ensure proper JSON syntax.
              </p>
            </div>

            <div className="pt-4 border-t border-outline-variant/40 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Saving...' : `Save ${typeName}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMajors;
