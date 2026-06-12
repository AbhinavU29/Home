import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  X, 
  Receipt,
  UserPlus,
  BadgeCheck,
  FileDown,
  AlertCircle,
  Search,
  Check,
  Edit2,
  Calendar,
  MessageCircle,
  History,
  FileText,
  Printer
} from 'lucide-react';

const PREDEFINED_ORNAMENTS = [
  "Necklace", "Bangle", "Ring", "Chain", "Earrings", "Bracelet", 
  "Pendant", "Coin", "Anklet", "Haram", "Nose Pin", "Bridal Set", 
  "Mangalsutra", "Kada", "Custom Item"
];

export default function Billing() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const editBillId = searchParams.get('edit');

  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [billDate, setBillDate] = useState('');
  
  // Search query for customer search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  
  // Filtered customers and Product templates
  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [productMasterList, setProductMasterList] = useState([]);

  // Customer Inline Modal Registration
  const [customerModal, setCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Billing Item Fields
  const [itemName, setItemName] = useState('');
  const [selectedPredefined, setSelectedPredefined] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [goldWeight, setGoldWeight] = useState(0);
  const [goldRate, setGoldRate] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [makingCharge, setMakingCharge] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [gstPercent, setGstPercent] = useState(3.0);

  // Billing list
  const [billingItems, setBillingItems] = useState([]);
  
  // Global Bill Discount
  const [discount, setDiscount] = useState(0);

  // Customer Previous Purchases
  const [prevPurchases, setPrevPurchases] = useState([]);
  const [prevPurchasesLoading, setPrevPurchasesLoading] = useState(false);

  // Selected Bill Details Modal (for previous purchases)
  const [selectedBillDetails, setSelectedBillDetails] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Submission Status
  const [loading, setLoading] = useState(false);
  const [createdBill, setCreatedBill] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Local Storage Draft restoration tracking
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  const getTodayDateTimeStr = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}`;
  };

  const parseToDateTimeLocal = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 16);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      let cleanStr = dateStr;
      if (typeof dateStr === 'string') {
        if (!dateStr.includes('Z') && !dateStr.includes('+') && !/-\d{2}:\d{2}/.test(dateStr)) {
          cleanStr = dateStr.replace('T', ' ');
          if (cleanStr.length === 16) {
            cleanStr += ':00+05:30';
          } else if (cleanStr.length === 19) {
            cleanStr += '+05:30';
          }
        }
      }
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const parts = formatter.formatToParts(d);
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
      const day = partMap.day;
      const month = partMap.month;
      const year = partMap.year;
      const hour = partMap.hour;
      const minute = partMap.minute;
      const ampm = partMap.dayPeriod ? partMap.dayPeriod.toUpperCase() : 'AM';
      return `${day}-${month}-${year} ${hour}:${minute} ${ampm} (IST)`;
    } catch (e) {
      return dateStr;
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
      setMatchingCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadProductMasterList = async () => {
    try {
      const res = await api.get('/products');
      setProductMasterList(res.data.filter(p => p.status === 'Active'));
    } catch (err) {
      console.error('Failed to load products list:', err);
    }
  };

  // Load edit data if editing a bill
  const loadEditBill = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/bills/${id}`);
      const bill = res.data;
      
      // Auto register/match customer details
      setSelectedCustomerId('');
      // Find matching customer from phone or name
      const custRes = await api.get('/customers');
      const matched = custRes.data.find(c => c.phone_number === bill.phone_number);
      if (matched) {
        setSelectedCustomerId(matched.customer_id.toString());
      } else {
        // Auto register them to list
        const newCust = await api.post('/customers', {
          customer_name: bill.customer_name,
          phone_number: bill.phone_number
        });
        setCustomers(prev => [...prev, newCust.data]);
        setSelectedCustomerId(newCust.data.customer_id.toString());
      }

      setDiscount(bill.discount);
      setBillDate(parseToDateTimeLocal(bill.date));
      
      // Map items
      const mapped = bill.items.map(item => ({
        product_name: item.product_name,
        ornament_type: item.ornament_type,
        quantity: item.quantity,
        weight_gold_g: item.weight_gold_g,
        rate_per_gram: item.rate_per_gram,
        MRP: item.MRP,
        making_charge: item.making_charge,
        discount: item.discount || 0.0,
        GST: item.GST,
        item_total: item.item_total
      }));
      setBillingItems(mapped);
      setSuccessMsg(`Editing Invoice ${bill.purchase_id} loaded successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error loading edit bill:', err);
      setErrorMsg('Failed to load bill for editing.');
    } finally {
      setLoading(false);
    }
  };

  // Handle draft loading and customer master database
  useEffect(() => {
    Promise.all([loadCustomers(), loadProductMasterList()]).then(() => {
      if (editBillId) {
        loadEditBill(editBillId);
      } else {
        // Restore draft from local storage
        const draftStr = localStorage.getItem('pos_billing_draft');
        if (draftStr) {
          try {
            const draft = JSON.parse(draftStr);
            if (draft.selectedCustomerId) setSelectedCustomerId(draft.selectedCustomerId);
            if (draft.date) setBillDate(draft.date);
            else setBillDate(getTodayDateTimeStr());
            if (draft.discount) setDiscount(draft.discount);
            if (draft.billingItems) setBillingItems(draft.billingItems);
          } catch (e) {
            console.error("Failed to restore POS draft from localStorage:", e);
            setBillDate(getTodayDateTimeStr());
          }
        } else {
          setBillDate(getTodayDateTimeStr());
        }
        setIsDraftRestored(true);
      }
    });
  }, [editBillId]);

  // Draft auto-saving to local storage
  useEffect(() => {
    if (editBillId || !isDraftRestored) return;
    const draft = {
      selectedCustomerId,
      billingItems,
      discount,
      date: billDate
    };
    localStorage.setItem('pos_billing_draft', JSON.stringify(draft));
  }, [selectedCustomerId, billingItems, discount, billDate, editBillId, isDraftRestored]);

  // Fetch previous purchases on customer selection change
  useEffect(() => {
    if (!selectedCustomerId) {
      setPrevPurchases([]);
      return;
    }
    const customerObj = customers.find(c => c.customer_id === parseInt(selectedCustomerId));
    if (!customerObj) return;

    const fetchPrevPurchases = async () => {
      setPrevPurchasesLoading(true);
      try {
        const res = await api.get('/bills', { params: { phone_number: customerObj.phone_number } });
        // Exclude current editing bill from historic purchases list
        const filtered = res.data.filter(b => b.bill_id !== parseInt(editBillId));
        setPrevPurchases(filtered);
      } catch (err) {
        console.error("Error loading customer historic purchases:", err);
      } finally {
        setPrevPurchasesLoading(false);
      }
    };
    fetchPrevPurchases();
  }, [selectedCustomerId, customers, editBillId]);

  // Debounced/Reactive customer matching filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatchingCustomers(customers);
      setSearchStatus('');
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    
    if (q.startsWith('pj')) {
      setSearchStatus('Searching by Purchase ID...');
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await api.get('/bills', { params: { purchase_id: q.toUpperCase() } });
          if (res.data && res.data.length > 0) {
            const matchedBill = res.data[0];
            const matchedCust = customers.filter(c => c.phone_number === matchedBill.phone_number);
            setMatchingCustomers(matchedCust);
            setSearchStatus(`Matching customer found for Invoice ${matchedBill.purchase_id}`);
          } else {
            setMatchingCustomers([]);
            setSearchStatus('No invoices found with that Purchase ID.');
          }
        } catch (err) {
          console.error(err);
          setSearchStatus('Error querying invoices by ID.');
        }
      }, 400);
      return () => clearTimeout(delayDebounce);
    } else {
      const filtered = customers.filter(c => 
        c.customer_name.toLowerCase().includes(q) || 
        c.phone_number.includes(q)
      );
      setMatchingCustomers(filtered);
      setSearchStatus(filtered.length > 0 ? `Found ${filtered.length} matching customers.` : 'No profiles match. Click "+ New Customer" to register.');
    }
  }, [searchQuery, customers]);

  const autofillToday = () => {
    setBillDate(getTodayDateTimeStr());
  };

  const clearForm = () => {
    localStorage.removeItem('pos_billing_draft');
    setSelectedCustomerId('');
    setBillingItems([]);
    setDiscount(0);
    setBillDate(getTodayDateTimeStr());
    setSearchQuery('');
    setSearchStatus('');
    setSuccessMsg('POS billing workspace cleared.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // Handle ornament predefined dropdown selection
  const handleDropdownChange = (val) => {
    setSelectedPredefined(val);
    if (val && val !== 'Custom Item') {
      setItemName(val);
    } else {
      setItemName('');
    }
  };

  // Search Customer functionality (by name, phone, or Purchase ID)
  const handleCustomerSearch = async () => {
    setSearchStatus('');
    setErrorMsg('');
    if (!searchQuery.trim()) {
      setSearchStatus('Please enter a search query.');
      return;
    }

    const query = searchQuery.trim().toLowerCase();

    // 1. Check if query matches Purchase ID format (starts with PJ)
    if (query.startsWith('pj')) {
      setSearchStatus('Searching by Purchase ID...');
      try {
        const res = await api.get('/bills', { params: { purchase_id: query.toUpperCase() } });
        if (res.data && res.data.length > 0) {
          const matchedBill = res.data[0];
          // Find or create customer
          const matchedCust = customers.find(c => c.phone_number === matchedBill.phone_number);
          if (matchedCust) {
            setSelectedCustomerId(matchedCust.customer_id.toString());
            setSearchStatus(`Match found: Selected customer ${matchedCust.customer_name} from invoice ${matchedBill.purchase_id}`);
          } else {
            // Register
            const regCust = await api.post('/customers', {
              customer_name: matchedBill.customer_name,
              phone_number: matchedBill.phone_number
            });
            setCustomers(prev => [...prev, regCust.data]);
            setSelectedCustomerId(regCust.data.customer_id.toString());
            setSearchStatus(`Registered & Selected customer ${regCust.data.customer_name} from invoice ${matchedBill.purchase_id}`);
          }
        } else {
          setSearchStatus('No invoices found with that Purchase ID.');
        }
      } catch (err) {
        console.error(err);
        setSearchStatus('Error querying invoices.');
      }
      return;
    }

    // 2. Search local customers database
    setSearchStatus('Searching customer registry...');
    const matched = customers.find(c => 
      c.customer_name.toLowerCase().includes(query) || 
      c.phone_number.includes(query)
    );

    if (matched) {
      setSelectedCustomerId(matched.customer_id.toString());
      setSearchStatus(`Selected customer profile: ${matched.customer_name}`);
    } else {
      setSearchStatus('No registered customer profile matches. Click "+" to register.');
    }
  };

  // Calculate specific single item totals for UI preview
  const calculateSingleItemTotal = (qty, weight, rate, itemMrp, making, lineDiscount, taxPct) => {
    const bullionVal = weight * rate;
    const mrpVal = qty * itemMrp;
    const baseSub = bullionVal + mrpVal + making;
    const netBase = Math.max(0, baseSub - lineDiscount);
    const tax = netBase * (taxPct / 100);
    return netBase + tax;
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName) {
      setErrorMsg('Item description is required.');
      return;
    }
    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    setErrorMsg('');
    const parsedQty = parseInt(quantity) || 1;
    const parsedWt = parseFloat(goldWeight) || 0.0;
    const parsedRate = parseFloat(goldRate) || 0.0;
    const parsedMrp = parseFloat(mrp) || 0.0;
    const parsedMaking = parseFloat(makingCharge) || 0.0;
    const parsedLineDiscount = parseFloat(itemDiscount) || 0.0;
    const parsedGst = parseFloat(gstPercent) || 3.0;

    const finalItemTotal = calculateSingleItemTotal(
      parsedQty, parsedWt, parsedRate, parsedMrp, parsedMaking, parsedLineDiscount, parsedGst
    );

    const newBillItem = {
      product_name: itemName,
      ornament_type: selectedPredefined || null,
      quantity: parsedQty,
      weight_gold_g: parsedWt,
      rate_per_gram: parsedRate,
      MRP: parsedMrp,
      making_charge: parsedMaking,
      discount: parsedLineDiscount,
      GST: parsedGst,
      item_total: finalItemTotal
    };

    if (editingItemIdx !== null) {
      const updatedItems = [...billingItems];
      updatedItems[editingItemIdx] = newBillItem;
      setBillingItems(updatedItems);
      setEditingItemIdx(null);
    } else {
      setBillingItems([...billingItems, newBillItem]);
    }
    
    // We intentionally do not clear the fields to retain the entered item details inside the Line Item Specification form
  };

  const editBillItem = (index) => {
    const item = billingItems[index];
    if (!item) return;
    setItemName(item.product_name || '');
    setSelectedPredefined(item.ornament_type || '');
    setQuantity(item.quantity || 1);
    setGoldWeight(item.weight_gold_g || 0);
    setGoldRate(item.rate_per_gram || 0);
    setMrp(item.MRP || 0);
    setMakingCharge(item.making_charge || 0);
    setItemDiscount(item.discount || 0);
    setGstPercent(item.GST || 3.0);
    setEditingItemIdx(index);
  };

  const removeBillItem = (index) => {
    setBillingItems(billingItems.filter((_, idx) => idx !== index));
    if (editingItemIdx === index) {
      setEditingItemIdx(null);
    } else if (editingItemIdx > index) {
      setEditingItemIdx(editingItemIdx - 1);
    }
  };

  // Add new customer inline modal flow
  const handleCreateCustomer = async (e, shouldSubmitBill = false) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    if (!newCustName || !newCustPhone) {
      setErrorMsg('Name and Phone number are required.');
      return;
    }
    try {
      const res = await api.post('/customers', {
        customer_name: newCustName,
        phone_number: newCustPhone,
        address: newCustAddress || null
      });
      const newCust = res.data;
      setCustomers(prev => [...prev, newCust]);
      setSelectedCustomerId(newCust.customer_id.toString());
      setCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setSuccessMsg('Customer registered successfully!');
      setTimeout(() => setSuccessMsg(''), 3500);

      if (shouldSubmitBill) {
        // Trigger submit with the newly created customer
        submitBill(false, newCust);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Customer registration failed.');
    }
  };

  // Calculate invoice subtotal, tax, and final amount
  const calculateBillSummary = () => {
    let subtotal = 0.0;
    billingItems.forEach((item) => {
      subtotal += item.item_total;
    });
    const parsedDiscount = parseFloat(discount) || 0.0;
    const finalAmount = Math.max(0.0, subtotal - parsedDiscount);
    return {
      subtotal,
      finalAmount
    };
  };

  const billSummary = calculateBillSummary();

  const handleDownloadPDF = async (billId, purchaseId, customerName) => {
    try {
      const response = await api.get(`/bills/${billId}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      const firstName = customerName ? customerName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : 'Customer';
      link.setAttribute('download', `${purchaseId}_${firstName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download invoice PDF.');
    }
  };

  const viewPreviousBillDetails = async (billId) => {
    setDetailsLoading(true);
    setDetailsModalOpen(true);
    try {
      const res = await api.get(`/bills/${billId}`);
      setSelectedBillDetails(res.data);
    } catch (err) {
      console.error('Error fetching details of previous purchase:', err);
      alert('Failed to fetch previous bill details.');
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Submit and save the invoice record
  const submitBill = async (showSuccessModal = false, overrideCustomer = null) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    const targetCustId = overrideCustomer ? overrideCustomer.customer_id : parseInt(selectedCustomerId);
    if (!targetCustId) {
      setErrorMsg('Please select a customer record first.');
      return;
    }
    if (billingItems.length === 0) {
      setErrorMsg('Please add at least one item to invoice list.');
      return;
    }

    setLoading(true);
    
    let customerObj = overrideCustomer;
    if (!customerObj) {
      customerObj = customers.find(c => c.customer_id === targetCustId);
    }
    
    if (!customerObj) {
      setErrorMsg('Invalid customer selection.');
      setLoading(false);
      return;
    }

    const payload = {
      customer_name: customerObj.customer_name,
      phone_number: customerObj.phone_number,
      company_name: 'Prasanth Jewellery',
      date: billDate || null,
      discount: parseFloat(discount) || 0.0,
      items: billingItems.map(item => ({
        product_name: item.product_name,
        ornament_type: item.ornament_type || null,
        quantity: item.quantity,
        weight_gold_g: item.weight_gold_g,
        rate_per_gram: item.rate_per_gram,
        MRP: item.MRP,
        making_charge: item.making_charge,
        discount: item.discount,
        GST: item.GST
      }))
    };

    try {
      let res;
      if (editBillId) {
        // Edit PUT flow
        res = await api.put(`/bills/${editBillId}`, payload);
        setSuccessMsg('Invoice updated successfully!');
      } else {
        // Create POST flow
        res = await api.post('/bills', payload);
        setSuccessMsg('Invoice generated and saved successfully!');
      }
      
      // Reset POS draft states
      localStorage.removeItem('pos_billing_draft');
      setBillingItems([]);
      setDiscount(0);
      setSelectedCustomerId('');
      setSearchQuery('');
      setSearchStatus('');
      setBillDate(getTodayDateTimeStr());

      if (showSuccessModal) {
        setCreatedBill(res.data);
      } else {
        // Stays on screen or redirects if editing
        if (editBillId) {
          setTimeout(() => navigate('/reports'), 1800);
        } else {
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit jewelry billing invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecord = (e) => {
    e.preventDefault();
    submitBill(false);
  };

  const handleGenerateInvoice = (e) => {
    e.preventDefault();
    submitBill(true);
  };

  const customerObj = customers.find(c => c.customer_id === parseInt(selectedCustomerId));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-800 dark:text-white">
            {editBillId ? 'Advanced Bill Editor' : 'POS Billing Console'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {editBillId 
              ? 'Update an existing tax invoice record, re-calculate valuations, and re-export PDFs.' 
              : 'Generate compliant invoices, compute gold weight values, HUID rates, and print receipts.'
            }
          </p>
        </div>
        {!editBillId && (
          <button 
            onClick={clearForm}
            className="text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-550 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg px-4.5 py-2.5 transition-colors"
          >
            Clear Form
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-3.5 rounded-xl text-xs flex items-center gap-2 no-print">
          <BadgeCheck className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2 no-print">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* POS Screen Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Columns - Configuration Inputs */}
        <div className="lg:col-span-3 space-y-6 no-print">
          
          {/* Customer Selection & Search Controls */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4 blue-glow">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                Customer Record Identification
              </label>
              
              {/* Customer Search Row */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Phone, Name, or Purchase ID..." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder:text-slate-400"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => setCustomerModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  + New Customer
                </button>
              </div>

              {searchStatus && (
                <div className="text-[10px] text-blue-600 dark:text-blue-450 font-semibold mb-3 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-1.5 rounded border border-blue-100 dark:border-blue-900">
                  {searchStatus}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Customer Profile ({matchingCustomers.length} matches) --</option>
                {matchingCustomers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_name} ({c.phone_number})
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomerId && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-blue-900 dark:text-blue-450 uppercase tracking-widest text-[9px]">
                    Selected Customer Summary
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Customer Name</span>
                      <strong className="text-slate-805 dark:text-white">{customerObj?.customer_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase">Phone Number</span>
                      <strong className="text-slate-855 dark:text-slate-200 font-mono">{customerObj?.phone_number}</strong>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-slate-450 text-[9px] uppercase">Total Purchase Value</span>
                      <strong className="text-green-600 dark:text-green-400 font-bold font-mono">
                        ₹{prevPurchases.reduce((sum, b) => sum + b.total_amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  Previous Purchases ({customerObj?.customer_name})
                </h4>
                
                {prevPurchasesLoading ? (
                  <div className="text-[10px] text-slate-450 animate-pulse py-1">Loading sales history...</div>
                ) : prevPurchases.length === 0 ? (
                  <div className="text-[10px] text-slate-450 italic py-1">No previous invoice purchases found for this client.</div>
                ) : (
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
                    {prevPurchases.map(b => (
                      <div key={b.bill_id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-850">
                        <span>{b.purchase_id} ({formatDateTime(b.date)})</span>
                        <div className="flex gap-2 items-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200">₹{b.total_amount.toLocaleString('en-IN')}</span>
                          <button 
                            type="button" 
                            onClick={() => viewPreviousBillDetails(b.bill_id)}
                            className="text-[9px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>v>

          {/* Line Item form */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4 blue-glow">
            <h3 className="font-serif text-md text-slate-800 dark:text-white font-bold">
              Line Item Specification
            </h3>
            
            <form onSubmit={handleAddItem} className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              
              {/* Product Catalog Auto-population */}
              <div className="space-y-1 col-span-2 sm:col-span-4">
                <label className="text-slate-400 dark:text-slate-500 block font-bold text-blue-600 dark:text-blue-450">
                  Select Product Master Design (Auto-populates fields)
                </label>
                <select 
                  onChange={(e) => {
                    const prodId = e.target.value;
                    if (!prodId) return;
                    const prod = productMasterList.find(p => p.product_id === parseInt(prodId));
                    if (prod) {
                      setItemName(prod.product_name);
                      setSelectedPredefined(prod.ornament_type);
                      setGoldWeight(prod.default_gold_weight || 0);
                      setMakingCharge(prod.default_making_charge || 0);
                      setGstPercent(prod.gst_percent || 3.0);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-900 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                >
                  <option value="">-- Choose Showroom Template Design --</option>
                  {productMasterList.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} ({p.ornament_type} | Wt: {p.default_gold_weight}g | Mc: ₹{p.default_making_charge})
                    </option>
                  ))}
                </select>
              </div>

              {/* Predefined Dropdown Combobox */}
              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Ornament Type</label>
                <select 
                  value={selectedPredefined}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Select Type --</option>
                  {PREDEFINED_ORNAMENTS.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Custom Ornament Text Input */}
              <div className="space-y-1 col-span-2 sm:col-span-4">
                <label className="text-slate-400 dark:text-slate-500 block">Description / Custom Name *</label>
                <input 
                  type="text" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                  placeholder="Type product name..." 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Quantity *</label>
                <input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Gold Weight (g)</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={goldWeight} 
                  onChange={(e) => setGoldWeight(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Rate / Gram (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={goldRate} 
                  onChange={(e) => setGoldRate(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Fixed MRP (₹)</label>
                <input 
                  type="number" 
                  value={mrp} 
                  onChange={(e) => setMrp(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Making Charge (₹)</label>
                <input 
                  type="number" 
                  value={makingCharge} 
                  onChange={(e) => setMakingCharge(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">Item Discount (₹)</label>
                <input 
                  type="number" 
                  value={itemDiscount} 
                  onChange={(e) => setItemDiscount(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 dark:text-slate-500 block">GST Tax %</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={gstPercent} 
                  onChange={(e) => setGstPercent(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                />
              </div>

              <div className="space-y-1 flex items-end sm:col-span-2">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm"
                >
                  {editingItemIdx !== null ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>

          {/* Items Ledger Table */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm blue-glow animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                    <th className="p-3.5 px-4">Sr</th>
                    <th className="p-3.5 px-4">Description</th>
                    <th className="p-3.5 px-4 text-center">Qty</th>
                    <th className="p-3.5 px-4 text-right">Gold Wt</th>
                    <th className="p-3.5 px-4 text-right">Rate/g</th>
                    <th className="p-3.5 px-4 text-right">MRP</th>
                    <th className="p-3.5 px-4 text-right">Making</th>
                    <th className="p-3.5 px-4 text-right">Discount</th>
                    <th className="p-3.5 px-4 text-right">GST %</th>
                    <th className="p-3.5 px-4 text-right">Line Total</th>
                    <th className="p-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-mono">
                  {billingItems.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="p-8 text-center text-slate-400 font-sans italic">
                        No ornaments or products added to this invoice ledger.
                      </td>
                    </tr>
                  ) : (
                    billingItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/35 transition-colors">
                        <td className="p-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 px-4 font-sans text-slate-800 dark:text-slate-200">
                          <div className="font-semibold">{item.product_name}</div>
                          {item.ornament_type && (
                            <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{item.ornament_type}</div>
                          )}
                        </td>
                        <td className="p-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-100">{item.quantity}</td>
                        <td className="p-3.5 px-4 text-right">{item.weight_gold_g > 0 ? `${item.weight_gold_g.toFixed(3)}g` : '-'}</td>
                        <td className="p-3.5 px-4 text-right">{item.rate_per_gram > 0 ? `₹${item.rate_per_gram.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="p-3.5 px-4 text-right">{item.MRP > 0 ? `₹${item.MRP.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="p-3.5 px-4 text-right">{item.making_charge > 0 ? `₹${item.making_charge.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="p-3.5 px-4 text-right text-red-500">{item.discount > 0 ? `₹${item.discount.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="p-3.5 px-4 text-right text-blue-600 dark:text-blue-400">{item.GST}%</td>
                        <td className="p-3.5 px-4 text-right font-extrabold text-slate-800 dark:text-white">
                          ₹{item.item_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3.5 px-4 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button 
                              type="button"
                              onClick={() => editBillItem(idx)}
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                              title="Edit Item"
                            >
                              <Edit2 className="w-4 h-4 mx-auto" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => removeBillItem(idx)} 
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right column - Summary Calculations Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-xl shadow-sm space-y-5 blue-glow no-print">
            <h3 className="font-serif text-lg text-slate-800 dark:text-white font-bold border-b border-slate-100 dark:border-slate-850 pb-3 flex items-center gap-1.5">
              <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Invoice Calculation
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-3.5 text-xs text-slate-650 dark:text-slate-350">
              <div className="flex justify-between font-mono">
                <span>Subtotal (incl. Tax):</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  ₹{billSummary.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Global Discount (₹):</span>
                <input 
                  type="number" 
                  value={discount} 
                  onChange={(e) => setDiscount(e.target.value)} 
                  className="w-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-right font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none" 
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex justify-between items-baseline font-mono">
                <span className="font-sans font-bold text-xs uppercase text-slate-400">Grand Total:</span>
                <strong className="text-2xl text-blue-600 dark:text-blue-400 font-extrabold">
                  ₹{billSummary.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Generate and save invoice triggering modal */}
              <button 
                type="button"
                onClick={handleGenerateInvoice}
                disabled={loading || billingItems.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500/50 text-white font-bold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate Invoice'}
              </button>

              {/* Save Draft explicitly without modal popup */}
              <button 
                type="button"
                onClick={handleSaveRecord}
                disabled={loading || billingItems.length === 0}
                className="w-full bg-slate-100 hover:bg-slate-250 dark:bg-slate-900 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all border border-slate-200 dark:border-slate-800"
              >
                Save Draft
              </button>
              
              {editBillId && (
                <button 
                  type="button"
                  onClick={() => navigate('/reports')}
                  className="w-full border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel Editing
                </button>
              )}
            </div>
          </div>



        </div>

      </div>

      {/* Invoice Success Dialog Modal */}
      {createdBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-fade-in" />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 relative z-10 space-y-6 shadow-2xl blue-glow text-center">
            <div className="space-y-2">
              <div className="inline-flex p-3 bg-green-500/10 text-green-600 rounded-full mb-2">
                <BadgeCheck className="w-12 h-12 animate-bounce" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-800 dark:text-white">
                Invoice Registered Successfully
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Purchase ID: <b>{createdBill.purchase_id}</b>
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl text-xs space-y-1.5 text-left border border-slate-150 dark:border-slate-850">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Name:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{createdBill.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone Number:</span>
                <span className="font-semibold text-slate-800 dark:text-white font-mono">{createdBill.phone_number}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-2 font-bold text-slate-800 dark:text-white">
                <span>Grand Total Paid:</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">₹{createdBill.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-bold uppercase tracking-wider">
              {/* Print action trigger */}
              <button 
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>

              {/* Download PDF */}
              <button 
                type="button"
                onClick={() => handleDownloadPDF(createdBill.bill_id, createdBill.purchase_id, createdBill.customer_name)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                PDF
              </button>

              {/* Share to WhatsApp */}
              <button 
                type="button"
                onClick={() => {
                  const text = `Dear ${createdBill.customer_name}, your Prasanth Jewellery invoice is ready.\nPurchase ID: ${createdBill.purchase_id}\nTotal amount paid: ₹${createdBill.total_amount.toLocaleString('en-IN')}.\nThank you for your visit!`;
                  const encoded = encodeURIComponent(text);
                  window.open(`https://api.whatsapp.com/send?phone=${createdBill.phone_number}&text=${encoded}`, '_blank');
                }}
                className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>

              <button 
                type="button"
                onClick={() => {
                  setCreatedBill(null);
                  if (editBillId) navigate('/reports');
                }}
                className="border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 py-3 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Customer Inline Dialog */}
      {customerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCustomerModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 relative z-10 space-y-4 shadow-2xl blue-glow">
            <button 
              onClick={() => setCustomerModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg text-slate-800 dark:text-white font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
              Register Customer Record
            </h3>
            
            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Full Name *</label>
                <input 
                  type="text" 
                  value={newCustName} 
                  onChange={(e) => setNewCustName(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Phone Number *</label>
                <input 
                  type="text" 
                  value={newCustPhone} 
                  onChange={(e) => setNewCustPhone(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Residential Address</label>
                <textarea 
                  value={newCustAddress} 
                  onChange={(e) => setNewCustAddress(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none h-16" 
                  placeholder="Street and City info"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setCustomerModal(false)} 
                  className="flex-1 border border-slate-200 dark:border-slate-800 py-2 rounded-lg text-slate-500 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs shadow-md shadow-blue-500/10"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Dialog Modal (for Previous Purchases) */}
      {detailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setDetailsModalOpen(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setDetailsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-405 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            {detailsLoading || !selectedBillDetails ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-6 text-xs text-slate-800 dark:text-slate-100">
                <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
                  <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Invoice: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{selectedBillDetails.purchase_id}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                    Company: {selectedBillDetails.company_name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
                  <div>
                    <span className="text-slate-405 block mb-0.5">Customer Name:</span>
                    <strong className="text-slate-800 dark:text-slate-100">{selectedBillDetails.customer_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-405 block mb-0.5">Customer Phone:</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-mono">{selectedBillDetails.phone_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-405 block mb-0.5">Billing Date:</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-mono">{formatDateTime(selectedBillDetails.date)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-405 block mb-0.5">Created By User ID:</span>
                    <strong className="text-slate-800 dark:text-slate-100 font-mono">#{selectedBillDetails.created_by}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-500">Invoice Itemized Breakdown</h4>
                  
                  <div className="border border-slate-200 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 text-slate-400 font-bold">
                          <th className="p-3">Ornament</th>
                          <th className="p-3 text-center">Qty</th>
                          <th className="p-3 text-right">Gold Wt</th>
                          <th className="p-3 text-right">Rate/g</th>
                          <th className="p-3 text-right">MRP</th>
                          <th className="p-3 text-right">Discount</th>
                          <th className="p-3 text-right">GST %</th>
                          <th className="p-3 text-right font-bold text-slate-800">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {selectedBillDetails.items.map((item) => (
                          <tr key={item.item_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 text-[11px]">
                            <td className="p-3 font-sans text-slate-755 dark:text-slate-300">
                              <div className="font-semibold">{item.product_name}</div>
                              {item.ornament_type && (
                                <div className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">{item.ornament_type}</div>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{item.quantity}</td>
                            <td className="p-3 text-right">{item.weight_gold_g > 0 ? `${item.weight_gold_g.toFixed(3)}g` : '-'}</td>
                            <td className="p-3 text-right">{item.rate_per_gram > 0 ? `₹${item.rate_per_gram.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-3 text-right">{item.MRP > 0 ? `₹${item.MRP.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-3 text-right text-red-500">{item.discount > 0 ? `₹${item.discount.toLocaleString('en-IN')}` : '-'}</td>
                            <td className="p-3 text-right text-blue-600 dark:text-blue-400">{item.GST}%</td>
                            <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                              ₹{item.item_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex flex-col items-end space-y-1.5 font-mono">
                  <div className="flex justify-between w-48 text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                    <span>Subtotal:</span>
                    <span>₹{selectedBillDetails.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between w-48 text-[11px] font-semibold text-red-500">
                    <span>Global Discount:</span>
                    <span>-₹{selectedBillDetails.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between w-48 border-t border-slate-200 dark:border-slate-800 pt-2 text-xs font-extrabold text-slate-800 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="text-blue-600 dark:text-blue-400">₹{selectedBillDetails.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase font-sans">Compliant Invoicing</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const text = `Dear ${selectedBillDetails.customer_name}, your Prasanth Jewellery invoice is ready.\nPurchase ID: ${selectedBillDetails.purchase_id}\nTotal amount paid: ₹${selectedBillDetails.total_amount.toLocaleString('en-IN')}.\nThank you for your visit!`;
                        const encoded = encodeURIComponent(text);
                        window.open(`https://api.whatsapp.com/send?phone=${selectedBillDetails.phone_number}&text=${encoded}`, '_blank');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors shadow-md shadow-green-500/10"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Share to WhatsApp
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(selectedBillDetails.bill_id, selectedBillDetails.purchase_id, selectedBillDetails.customer_name)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-md shadow-blue-500/10"
                    >
                      <FileText className="w-4 h-4" />
                      Download PDF Invoice
                    </button>
                    {role === 'Admin' && (
                      <button 
                        onClick={() => {
                          setDetailsModalOpen(false);
                          navigate(`/billing?edit=${selectedBillDetails.bill_id}`);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors shadow-md shadow-amber-500/10"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Bill
                      </button>
                    )}
                    <button 
                      onClick={() => setDetailsModalOpen(false)}
                      className="border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2 px-4 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Customer Registration Inline Modal */}
      {customerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCustomerModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow">
            <button 
              type="button"
              onClick={() => setCustomerModal(false)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-655"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-lg text-slate-850 dark:text-white font-bold border-b border-slate-105 dark:border-slate-850 pb-3 flex items-center gap-1.5">
              <UserPlus className="w-5 h-5 text-blue-605" />
              Register New Customer
            </h3>
            
            <form className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Customer Name *
                </label>
                <input 
                  type="text" 
                  value={newCustName} 
                  onChange={(e) => setNewCustName(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-850 dark:text-slate-100 focus:outline-none" 
                  placeholder="e.g. Abhinav Sharma"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Phone Number *
                </label>
                <input 
                  type="text" 
                  value={newCustPhone} 
                  onChange={(e) => setNewCustPhone(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-850 dark:text-slate-100 focus:outline-none font-mono" 
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-550 block">
                  Address (Optional)
                </label>
                <textarea 
                  value={newCustAddress} 
                  onChange={(e) => setNewCustAddress(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-855 dark:text-slate-100 focus:outline-none" 
                  placeholder="Enter address details..." 
                  rows="2"
                />
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setCustomerModal(false)} 
                    className="flex-1 border border-slate-205 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => handleCreateCustomer(e, false)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md shadow-blue-500/10"
                  >
                    Save Customer
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={(e) => handleCreateCustomer(e, true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md shadow-green-500/10 uppercase tracking-wider text-[10px]"
                >
                  Save & Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
