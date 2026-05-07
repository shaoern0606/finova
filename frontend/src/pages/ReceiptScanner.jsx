import { Camera, Check, FileText, Loader2, UploadCloud, X, Plus, Trash2, Aperture, RefreshCw, Target } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE, post, api } from "../api.js";

export default function ReceiptScanner({ onTransactionSaved }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState("");
  const [serverFileUrl, setServerFileUrl] = useState(null);
  const [rawText, setRawText] = useState("");
  
  // Camera state
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Form state
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Other");
  const [customCategory, setCustomCategory] = useState("");
  const [items, setItems] = useState([]);
  const [amount, setAmount] = useState("");
  const [tax, setTax] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [showMetadata, setShowMetadata] = useState(false);
  
  // Goals state
  const [goals, setGoals] = useState([]);
  const [goalAllocations, setGoalAllocations] = useState([]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const categories = ["Food", "Transport", "Shopping", "Entertainment", "Utilities", "Healthcare", "Other"];

  // Fetch Goals
  useEffect(() => {
    api("/goals").then(setGoals).catch(console.error);
  }, []);

  // Handle Camera initialization
  useEffect(() => {
    let stream = null;
    if (useCamera && !preview) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setCameraActive(true);
          }
        })
        .catch(err => {
          setError("Camera access denied or unavailable.");
          setUseCamera(false);
        });
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useCamera, preview]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob and process
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
      handleFileUpload(capturedFile);
    }, "image/jpeg", 0.8);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    handleFileUpload(selectedFile);
  };

  const handleFileUpload = async (selectedFile) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError("");
    setExtractedData(null);
    setLoading(true);
    setUseCamera(false);
    setCameraActive(false);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/ocr/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const result = await response.json();
      const data = result.extracted_data.parsed || result.extracted_data;
      const rawTextData = result.extracted_data.raw_text || "";

      setExtractedData(data);
      setServerFileUrl(result.file_url);
      setRawText(rawTextData);
      
      setMerchant(data.merchant || "");
      setDate(data.date || "");
      setAmount(data.total ? data.total.toString() : "");
      setTax(data.tax || 0);
      setServiceCharge(data.service_charge || 0);
      setCategory(categories.includes(data.category) ? data.category : "Other");
      if (!categories.includes(data.category) && data.category && data.category !== "Other") {
        setCustomCategory(data.category);
      }
      
      // Setup items list
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        setItems(data.items.map(item => ({ 
          name: item.name || "Unknown Item", 
          price: item.price ? item.price.toString() : "0.00" 
        })));
      } else {
        setItems([]);
      }

    } catch (err) {
      setError(err.message || "Failed to process receipt");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    setServerFileUrl(null);
    setRawText("");
    setError("");
    setMerchant("");
    setDate("");
    setAmount("");
    setTax(0);
    setServiceCharge(0);
    setCategory("Other");
    setCustomCategory("");
    setItems([]);
    setGoalAllocations([]);
    setShowNewGoal(false);
    setUseCamera(false);
  };

  const handleConfirm = async () => {
    if (!merchant || !date || items.length === 0) {
      setError("Merchant, Date, and at least one Item are required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        merchant,
        date,
        amount: parseFloat(amount) || 0,
        category,
        custom_category: customCategory,
        receipt_url: serverFileUrl || preview,
        items: items.map(i => ({ name: i.name, price: parseFloat(i.price) || 0 })),
        raw_text: rawText,
        tax: tax,
        service_charge: serviceCharge,
        goalAllocation: goalAllocations.filter(g => g.allocatedAmount > 0)
      };

      await post("/ocr/confirm", payload);
      
      if (onTransactionSaved) {
        onTransactionSaved();
      }
    } catch (err) {
      setError(err.message || "Failed to save transaction");
      setLoading(false);
    }
  };

  // Item Management
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const oldPrice = parseFloat(newItems[index].price) || 0;
    newItems[index][field] = value;
    
    if (field === 'price') {
      const newPrice = parseFloat(value) || 0;
      const diff = newPrice - oldPrice;
      if (diff !== 0) {
        setAmount((prev) => (parseFloat(prev || 0) + diff).toFixed(2));
      }
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", price: "" }]);
  };

  const removeItem = (index) => {
    const oldPrice = parseFloat(items[index].price) || 0;
    if (oldPrice > 0) {
      setAmount((prev) => (Math.max(0, parseFloat(prev || 0) - oldPrice)).toFixed(2));
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Goal Management
  const totalAllocated = goalAllocations.reduce((sum, g) => sum + (parseFloat(g.allocatedAmount) || 0), 0);
  const unallocatedAmount = Math.max(0, (parseFloat(amount) || 0) - totalAllocated);

  const handleCreateNewGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    try {
      const result = await post("/goals", { name: newGoalName, target_amount: parseFloat(newGoalTarget) });
      setGoals([...goals, result.goal]);
      addGoalAllocation(result.goal.id);
      setShowNewGoal(false);
      setNewGoalName("");
      setNewGoalTarget("");
    } catch (e) {
      setError("Failed to create new goal");
    }
  };

  const addGoalAllocation = (goalId) => {
    if (!goalId) return;
    if (goalAllocations.find(g => g.goalId === goalId)) return;
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setGoalAllocations([...goalAllocations, { goalId: goal.id, goalName: goal.name, allocatedAmount: unallocatedAmount > 0 ? unallocatedAmount : 0 }]);
    }
  };

  const updateGoalAllocation = (index, value) => {
    const newAlloc = [...goalAllocations];
    newAlloc[index].allocatedAmount = parseFloat(value) || 0;
    setGoalAllocations(newAlloc);
  };

  const removeGoalAllocation = (index) => {
    setGoalAllocations(goalAllocations.filter((_, i) => i !== index));
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gx-900">Scan Receipt</h1>
          <p className="text-slate-500">Auto-extract and edit transaction details</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Col: Upload / Image Section */}
        <div className="flex flex-col gap-4">
          <div 
            className={`relative flex min-h-[500px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 transition-colors ${
              preview || useCamera ? "border-transparent bg-black" : "border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Receipt Preview" className="h-full w-full object-contain opacity-80" />
                {!loading && !extractedData && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                     <Loader2 className="h-10 w-10 animate-spin text-white" />
                   </div>
                )}
                <button 
                  onClick={reset}
                  className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 backdrop-blur"
                >
                  <X size={20} />
                </button>
              </>
            ) : useCamera ? (
              <>
                <video ref={videoRef} className="h-full w-full object-cover" playsInline />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Camera Overlay */}
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                   <div className="w-full h-full border-2 border-white/50 rounded-lg"></div>
                </div>

                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 px-4">
                  <button 
                    onClick={() => setUseCamera(false)}
                    className="rounded-full bg-white/20 p-4 text-white backdrop-blur hover:bg-white/30"
                  >
                    <X size={24} />
                  </button>
                  <button 
                    onClick={capturePhoto}
                    disabled={!cameraActive}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-gx-600 shadow-xl transition active:scale-95 disabled:opacity-50"
                  >
                    <Aperture size={32} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-white/20 p-4 text-white backdrop-blur hover:bg-white/30"
                  >
                    <UploadCloud size={24} />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-gx-600 shadow-sm">
                  <Camera size={36} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gx-900">Add a Receipt</h3>
                <p className="mb-8 text-sm text-slate-500">Take a photo or upload an image to auto-extract details</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={() => setUseCamera(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gx-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-gx-600"
                  >
                    <Camera size={20} />
                    <span>Open Camera</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <UploadCloud size={20} />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {loading && (
             <div className="flex items-center justify-center gap-3 rounded-xl bg-blue-50 p-4 text-blue-700 animate-pulse">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span className="font-medium">AI is extracting details...</span>
             </div>
          )}

          {error && (
             <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
               {error}
             </div>
          )}
        </div>

        {/* Right Col: Data Form Section */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm min-h-[500px] flex flex-col">
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-gx-500" size={24} />
                <h2 className="text-xl font-bold text-gx-900">Transaction Details</h2>
              </div>
            {extractedData && (
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Amount (RM)</p>
                <input 
                  type="number" 
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  className="w-32 rounded-lg border-b-2 border-transparent bg-transparent py-1 text-right text-3xl font-black text-gx-900 focus:border-gx-500 focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
            )}
            </div>

            {!extractedData ? (
               <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p>Scan a receipt to see editable details here</p>
               </div>
            ) : (
              <div className="flex-1 space-y-5 text-left overflow-y-auto pr-2 pb-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Merchant Name</label>
                  <input 
                    type="text" 
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-medium text-gx-900 focus:border-gx-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gx-500/20 transition-all"
                    placeholder="e.g., Jaya Grocer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-medium text-gx-900 focus:border-gx-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gx-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-medium text-gx-900 focus:border-gx-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gx-500/20 transition-all appearance-none"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {category === "Other" && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Custom Category Name</label>
                    <input 
                      type="text" 
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 font-medium text-gx-900 focus:border-gx-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gx-500/20 transition-all"
                      placeholder="e.g., Subscriptions"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Purchased Items</label>
                    <button 
                      onClick={addItem}
                      className="flex items-center gap-1 text-xs font-bold text-gx-600 hover:text-gx-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No items detected. Add them manually.</p>
                    ) : (
                      items.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start group">
                          <div className="flex-1">
                            <input 
                              type="text" 
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              placeholder="Item name"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-gx-500 focus:outline-none focus:ring-1 focus:ring-gx-500 transition-all"
                            />
                          </div>
                          <div className="w-28 relative">
                            <span className="absolute left-3 top-2 text-sm text-slate-400 font-medium">RM</span>
                            <input 
                              type="number" 
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              placeholder="0.00"
                              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm font-medium focus:border-gx-500 focus:outline-none focus:ring-1 focus:ring-gx-500 transition-all"
                            />
                          </div>
                          <button 
                            onClick={() => removeItem(index)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                  >
                    {showMetadata ? "Hide Receipt Metadata" : "Show Receipt Metadata (Tax/Service)"}
                  </button>
                  
                  {showMetadata && (
                    <div className="mt-3 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">Tax / SST</p>
                        <p className="mt-1 font-semibold text-gx-900">RM {parseFloat(tax || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">Service Charge</p>
                        <p className="mt-1 font-semibold text-gx-900">RM {parseFloat(serviceCharge || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Savings Goal Allocation (Optional)</label>
                  </div>
                  
                  <div className="space-y-3">
                    {goalAllocations.map((alloc, index) => (
                      <div key={index} className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <Target size={16} className="text-gx-500 ml-1" />
                        <span className="flex-1 text-sm font-semibold text-slate-700">{alloc.goalName}</span>
                        <div className="w-24 relative">
                          <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-medium">RM</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={alloc.allocatedAmount}
                            onChange={(e) => updateGoalAllocation(index, e.target.value)}
                            className="w-full rounded bg-white pl-7 pr-2 py-1.5 text-sm font-bold text-gx-900 focus:outline-none focus:ring-1 focus:ring-gx-500"
                          />
                        </div>
                        <button onClick={() => removeGoalAllocation(index)} className="p-1.5 text-slate-400 hover:text-red-500 transition">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    
                    {showNewGoal ? (
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 space-y-3">
                        <input type="text" placeholder="Goal Name (e.g. Vacation)" value={newGoalName} onChange={e => setNewGoalName(e.target.value)} className="w-full text-sm p-2 rounded border border-emerald-200" />
                        <input type="number" placeholder="Target Amount (RM)" value={newGoalTarget} onChange={e => setNewGoalTarget(e.target.value)} className="w-full text-sm p-2 rounded border border-emerald-200" />
                        <div className="flex gap-2">
                          <button onClick={() => setShowNewGoal(false)} className="flex-1 text-xs py-2 text-slate-500 font-bold bg-white rounded border border-slate-200">Cancel</button>
                          <button onClick={handleCreateNewGoal} className="flex-1 text-xs py-2 text-white font-bold bg-gx-500 rounded">Create & Select</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select 
                          onChange={(e) => { addGoalAllocation(e.target.value); e.target.value = ""; }}
                          className="flex-1 text-sm p-2 rounded-lg border border-slate-200 bg-white"
                          defaultValue=""
                        >
                          <option value="" disabled>Select Goal to Allocate...</option>
                          {goals.filter(g => !goalAllocations.find(a => a.goalId === g.id)).map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <button onClick={() => setShowNewGoal(true)} className="px-3 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg whitespace-nowrap">
                          + New Goal
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-between text-xs font-semibold px-1">
                    <span className="text-slate-500">Unallocated Amount:</span>
                    <span className={unallocatedAmount < 0 ? "text-red-500" : "text-gx-600"}>RM {unallocatedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            )}

            {extractedData && (
              <div className="mt-4 flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={reset}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 flex-[1] rounded-xl bg-slate-100 py-4 font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
                >
                  <RefreshCw size={18} />
                  <span>Retake</span>
                </button>
                <button 
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gx-500 py-4 font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-gx-600 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                  <span>Confirm & Save</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
