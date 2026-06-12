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
  
  // Results
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [isValidated, setIsValidated] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setValidationResult(null);
      setImportResult(null);
      setIsValidated(false);
      setErrorMsg('');
    }
  };

  const handleDownloadTemplate = async () => {
    setErrorMsg('');
    try {
      const endpoint = activeTab === 'users' ? '/import/users/template' : '/import/products/template';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', activeTab === 'users' ? 'users_import_template.xlsx' : 'products_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to download template file. Please try again later.');
    }
  };

  const handleSubmit = async (dryRun) => {
    setErrorMsg('');
    if (dryRun) {
      setValidationResult(null);
      setIsValidated(false);
    } else {
      setImportResult(null);
    }

    if (!file) {
      setErrorMsg('Please select an Excel file to upload first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const endpoint = activeTab === 'users' 
        ? `/import/users?dry_run=${dryRun}` 
        : `/import/products?dry_run=${dryRun}`;
      
      const res = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (dryRun) {
        setValidationResult(res.data);
        setIsValidated(true);
      } else {
        setImportResult(res.data);
        setFile(null);
        setIsValidated(false);
        setValidationResult(null);
        if (document.getElementById('excel-file-picker')) {
          document.getElementById('excel-file-picker').value = '';
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to process spreadsheet file.');
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
          onClick={() => { setActiveTab('products'); setValidationResult(null); setImportResult(null); setIsValidated(false); setErrorMsg(''); setFile(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600 dark:border-blue-450 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          Import Products
        </button>
        <button
          onClick={() => { setActiveTab('users'); setValidationResult(null); setImportResult(null); setIsValidated(false); setErrorMsg(''); setFile(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:border-blue-450 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Import Users
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
              <table className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-[10px] text-slate-650 dark:text-slate-400">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-left font-bold text-slate-700 dark:text-slate-300">
                    <th className="p-2">Header Name</th>
                    <th className="p-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Name</td>
                    <td className="p-2">Operator Full Name (Optional)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Username</td>
                    <td className="p-2">System login code (Required, Unique)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Password</td>
                    <td className="p-2">Strong password (Required, Min 8 chars)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Role</td>
                    <td className="p-2">Admin / Operator (Optional)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Mobile</td>
                    <td className="p-2">Mobile phone details (Optional)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-500 leading-relaxed">
                Import standard jewelry designs. The Excel sheet should contain columns with the following header keywords:
              </p>
              <table className="w-full border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-[10px] text-slate-650 dark:text-slate-400">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-left font-bold text-slate-700 dark:text-slate-300">
                    <th className="p-2">Header Name</th>
                    <th className="p-2">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Product Name</td>
                    <td className="p-2">Name of jewelry design (Required)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Ornament Type</td>
                    <td className="p-2">Catalog class (Ring, Necklace, Bangle etc.)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Gold Weight</td>
                    <td className="p-2">Default weight in grams (Optional)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">Making Charge</td>
                    <td className="p-2">Default line making charge (Optional)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-slate-800 dark:text-white">GST</td>
                    <td className="p-2">Tax percent (Optional, default 3%)</td>
                  </tr>
                </tbody>
              </table>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-850">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Spreadsheet File Upload
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Select a .xlsx or .xls file to validate and import</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-blue-50 hover:bg-blue-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-slate-800 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all uppercase tracking-wider text-[10px]"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-450" />
                Download Sample Template
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-750 p-3.5 rounded-lg text-xs flex items-center gap-2">
                <XCircle className="w-4.5 h-4.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
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
                    {file ? file.name : "Drag and drop or click to choose Excel file (Upload Excel)"}
                  </div>
                  {file && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                <button
                  type="button"
                  disabled={loading || !file}
                  onClick={() => handleSubmit(true)}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow transition-all uppercase tracking-wider text-[10px]"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Validate Data
                </button>
                <button
                  type="button"
                  disabled={loading || !file}
                  onClick={() => handleSubmit(false)}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow transition-all uppercase tracking-wider text-[10px]"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Validation Result Dashboard */}
          {validationResult && (
            <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl p-6 shadow-xs space-y-6 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                <CheckCircle2 className="w-5 h-5 text-amber-500 animate-pulse" />
                Data Validation Dry-Run Results
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Rows</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono">{validationResult.total_rows}</span>
                </div>
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 p-4 rounded-xl">
                  <span className="text-[10px] text-green-500 uppercase tracking-wider block mb-1">Pass Validation</span>
                  <span className="text-2xl font-extrabold text-green-650 dark:text-green-400 font-mono">{validationResult.success_count}</span>
                </div>
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 p-4 rounded-xl">
                  <span className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">Validation Errors</span>
                  <span className="text-2xl font-extrabold text-red-650 dark:text-red-400 font-mono">{validationResult.failure_count}</span>
                </div>
              </div>

              {validationResult.errors && validationResult.errors.length > 0 ? (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Row-by-Row Error Log (Will be skipped during import)
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[10px]">
                    {validationResult.errors.map((err, i) => (
                      <div key={i} className="p-3 bg-red-50/10 hover:bg-red-50/20 flex gap-4">
                        <span className="font-bold text-red-500 block shrink-0">Row {err.row}:</span>
                        <span className="text-slate-600 dark:text-slate-400 leading-normal">{err.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold text-center">
                  ✓ All rows validated successfully! The file is ready for import.
                </div>
              )}
            </div>
          )}

          {/* Import Result Dashboard */}
          {importResult && (
            <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl p-6 shadow-xs space-y-6 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Data Import Confirmed Results
              </h3>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Total Processed</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white font-mono">{importResult.total_rows}</span>
                </div>
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 p-4 rounded-xl">
                  <span className="text-[10px] text-green-500 uppercase tracking-wider block mb-1">Successfully Saved</span>
                  <span className="text-2xl font-extrabold text-green-650 dark:text-green-400 font-mono">{importResult.success_count}</span>
                </div>
                <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 p-4 rounded-xl">
                  <span className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">Skipped / Failed</span>
                  <span className="text-2xl font-extrabold text-red-650 dark:text-red-400 font-mono">{importResult.failure_count}</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="space-y-3 border-t border-slate-100 dark:border-slate-850 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-500" />
                    Row-by-Row Error Log
                  </h4>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-850 font-mono text-[10px]">
                    {importResult.errors.map((err, i) => (
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
