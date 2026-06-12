import React, { useState } from 'react';
import api from '../utils/api';
import { 
  FileSpreadsheet, 
  Upload, 
  Users, 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Info,
  ArrowRight
} from 'lucide-react';

export default function ImportData() {
  const [activeTab, setActiveTab] = useState('products'); // 'users' or 'products'
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Import results
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg('');
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResult(null);

    if (!file) {
      setErrorMsg('Please select an Excel file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const endpoint = activeTab === 'users' ? '/import/users' : '/import/products';
      const res = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
      setFile(null);
      // Reset input element
      document.getElementById('excel-file-picker').value = '';
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Import failed. Check file format or contents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-205 dark:border-slate-850 pb-4">
        <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-850 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-8 h-8 text-green-650 dark:text-green-400" />
          Bulk Data Import Registry
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload bulk data spreadsheets to populate system users and showroom product masters dynamically.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
        <button
          onClick={() => { setActiveTab('products'); setResult(null); setErrorMsg(''); setFile(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600 dark:border-blue-450 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          Product Master Import
        </button>
        <button
          onClick={() => { setActiveTab('users'); setResult(null); setErrorMsg(''); setFile(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:border-blue-450 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          User Accounts Import
        </button>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Instructions */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-350 flex items-center gap-1">
            <Info className="w-4 h-4 text-blue-500" />
            File Structure Instructions
          </h3>

          {activeTab === 'users' ? (
            <div className="space-y-3">
              <p className="text-slate-500 leading-relaxed">
                Import operator and admin profiles. The Excel sheet should contain columns with the following header keywords:
              </p>
              <ul className="space-y-2 border-l border-slate-200 pl-4 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-800 dark:text-white">Name</strong> - Operator Full Name (Optional)</li>
                <li><strong className="text-slate-800 dark:text-white">Username</strong> - System login code (Required, Unique)</li>
                <li><strong className="text-slate-800 dark:text-white">Password</strong> - Strong password (Required, Min 8 chars, 1 upper, 1 lower, 1 digit, 1 special character)</li>
                <li><strong className="text-slate-800 dark:text-white">Role</strong> - Access role (Optional, "Admin" or "Operator", default is Operator)</li>
                <li><strong className="text-slate-800 dark:text-white">Mobile Number</strong> - Mobile phone details (Optional)</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-500 leading-relaxed">
                Import standard jewelry designs. The Excel sheet should contain columns with the following header keywords:
              </p>
              <ul className="space-y-2 border-l border-slate-200 pl-4 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-800 dark:text-white">Product Name</strong> - Name of jewelry design (Required)</li>
                <li><strong className="text-slate-800 dark:text-white">Ornament Type</strong> - Catalog class (Required, e.g. Ring, Bangle, Necklace, etc.)</li>
                <li><strong className="text-slate-800 dark:text-white">Gold Weight</strong> - Default weight in grams (Optional)</li>
                <li><strong className="text-slate-800 dark:text-white">Making Charge</strong> - Default line making charge (Optional)</li>
                <li><strong className="text-slate-800 dark:text-white">GST</strong> - Tax percent (Optional, default is 3%)</li>
              </ul>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-500 leading-relaxed">
              <strong>Duplicate checking:</strong> System validates usernames and product-type combinations. Duplicate records in the file or existing registry will log as skipped rows in the error report.
            </div>
          </div>
        </div>

        {/* Right Side: Upload Card & Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upload Form */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Select spreadsheet file (.xlsx or .xls)
            </h3>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-750 p-3.5 rounded-lg text-xs flex items-center gap-2">
                <XCircle className="w-4.5 h-4.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-all relative">
                <input 
                  type="file" 
                  id="excel-file-picker"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="font-semibold text-slate-650 dark:text-slate-350">
                    {file ? file.name : "Drag and drop or click to choose Excel file"}
                  </div>
                  {file && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow disabled:opacity-40 transition-colors uppercase tracking-wider text-[11px]"
                >
                  {loading ? (
                    <>
                      <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Importing Records...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4.5 h-4.5" />
                      Upload & Import Data
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Import Result Dashboard */}
          {result && (
            <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Import Summary Results
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Rows</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono">{result.total_rows}</span>
                </div>
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 p-4 rounded-xl">
                  <span className="text-[10px] text-green-500 uppercase tracking-wider block mb-1">Successfully Imported</span>
                  <span className="text-2xl font-extrabold text-green-650 dark:text-green-400 font-mono">{result.success_count}</span>
                </div>
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 p-4 rounded-xl">
                  <span className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">Skipped / Failed</span>
                  <span className="text-2xl font-extrabold text-red-650 dark:text-red-400 font-mono">{result.failure_count}</span>
                </div>
              </div>

              {/* Error Report List */}
              {result.errors && result.errors.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Row-by-Row Error Log
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[10px]">
                    {result.errors.map((err, i) => (
                      <div key={i} className="p-3 bg-red-50/10 hover:bg-red-50/20 flex gap-4">
                        <span className="font-bold text-red-500 block shrink-0">Row {err.row}:</span>
                        <span className="text-slate-600 dark:text-slate-400 leading-normal">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
