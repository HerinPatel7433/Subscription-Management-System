import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, PackagePlus, Zap, Rocket, CheckCircle2, ChevronRight, Layers, CreditCard } from 'lucide-react';
import { Toast, useToast } from '@/components/Toast';
import { getPlans, getProducts, userSubscribe, type RecurringPlan, type Product } from '@/services/subscriptionService';

export default function SubscribePage() {
  const navigate = useNavigate();
  const { toast, toasts, dismiss } = useToast();

  const [plans, setPlans] = useState<RecurringPlan[]>([]);
  const [services, setServices] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [plansRes, productsRes] = await Promise.all([
          getPlans(),
          getProducts(),
        ]);
        // Only active/usable plans & products
        // Wait, is 'plansRes' just data or does axios wrapper automatically unwrap? 
        // Based on existing api.js interceptor: response.data = response.data.data;
        // So the data itself is the array. BUT getPlans type returns promise with the array.
        // Wait, the interceptor code is:
        // if (response.data && 'success' in response.data && 'data' in response.data) response.data = response.data.data;
        // So `getPlans()` returns a Promise containing the unwrapped `data` array in the resolved value or just standard Axios response with `.data` being the array.
        // E.g., `const res = await getPlans(); setPlans(res.data);` was used in PlansPage!
        // Wait! Let's check `PlansPage.tsx`: `const res = await getPlans(); setPlans(res.data);` 
        // Wait, if the interceptor changes `response.data` to be the array, `res.data` IS the array. 
        // Or if getPlans is generic `api.get<RecurringPlan[]>('/plans')`, it resolves to `AxiosResponse<RecurringPlan[]>`. So `res.data` is the array.

        // Actually it's probably safe to use `.data` if `res` has it, or just use the array if the interceptor replaced it entirely in the whole promise? No, it replaces `response.data`.
        // Let's coerce just in case:
        const pData = (plansRes.data || plansRes) as unknown as RecurringPlan[];
        const sData = (productsRes.data || productsRes) as unknown as Product[];
        
        // Let's just use what plansRes.data provides
        setPlans(Array.isArray(pData) ? pData : []);
        setServices(Array.isArray(sData) ? sData : []);
        
      } catch (err) {
        console.error('Failed to load store data:', err);
        toast('error', 'Failed to load plans and services.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const toggleService = (productId: string) => {
    setSelectedServices(prev => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const updateServiceQuantity = (productId: string, diff: number) => {
    setSelectedServices(prev => {
      const next = { ...prev };
      if (next[productId] !== undefined) {
        const newQ = next[productId] + diff;
        if (newQ > 0) {
          next[productId] = newQ;
        } else {
          delete next[productId];
        }
      }
      return next;
    });
  };

  const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId), [plans, selectedPlanId]);
  
  const totalPrice = useMemo(() => {
    let total = 0;
    if (selectedPlan) {
      total += Number(selectedPlan.price);
    }
    for (const [id, qty] of Object.entries(selectedServices)) {
      const svc = services.find(s => s.id === id);
      if (svc) {
        total += Number(svc.sales_price) * qty;
      }
    }
    return total;
  }, [selectedPlan, selectedServices, services]);

  const handleSubscribe = async () => {
    if (!selectedPlanId) return;
    try {
      setSubmitting(true);
      const svcArray = Object.entries(selectedServices).map(([product_id, quantity]) => ({
        product_id,
        quantity,
      }));

      await userSubscribe({
        plan_id: selectedPlanId,
        services: svcArray,
      });

      toast('success', 'Subscription created! Redirecting...');
      setTimeout(() => navigate('/my-subscriptions'), 1500);

    } catch (err) {
      console.error(err);
      toast('error', 'Failed to create subscription.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm animate-pulse">Loading amazing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
      {/* Hero Section */}
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold tracking-wider uppercase mb-2">
          <Rocket size={14} /> Subscription Store
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Choose a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-violet-400">Plan</span> that fits you.
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Get started with our premium subscriptions. Add powerful extra services to perfectly tailor your experience.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Main Content: Plans & Services */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Plans Selection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-sm">1</span> 
              Select Base Plan
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {plans.length === 0 && (
                <div className="col-span-2 p-8 border border-slate-700/50 border-dashed rounded-2xl text-center text-slate-500">
                  No plans available currently.
                </div>
              )}
              {plans.map(plan => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative w-full text-left rounded-3xl p-6 transition-all duration-300 border-2 overflow-hidden group
                      ${isSelected 
                        ? 'bg-primary-900/20 border-primary-500 shadow-[0_0_30px_-5px_rgba(var(--primary-500),0.3)] scale-[1.02]' 
                        : 'bg-[#131929] border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/80'}`
                    }
                  >
                    {/* Glowing effect in background for selected */}
                    {isSelected && (
                      <div className="absolute -inset-24 bg-gradient-to-r from-primary-500/20 to-violet-500/20 blur-3xl rounded-full opacity-50 z-0 pointer-events-none" />
                    )}
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                          <div className={'text-xs font-semibold tracking-wider uppercase inline-block px-2 py-0.5 rounded border ' + 
                            (isSelected ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'bg-slate-800 text-slate-400 border-slate-700')
                          }>
                            {plan.billing_period}
                          </div>
                        </div>
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-600 text-transparent'}`}>
                          <Check size={14} />
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-3xl font-black text-white">₹{Number(plan.price).toFixed(2)}</span>
                        <span className="text-slate-400 text-sm"> / {plan.billing_period}</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>Minimum quantity: {plan.min_qty}</span>
                        </div>
                        {plan.pausable && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span>Can be paused at any time</span>
                          </div>
                        )}
                        {plan.renewable && (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span>Auto-renewable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Services Selection */}
          <section className={`${!selectedPlanId ? 'opacity-50 pointer-events-none' : 'opacity-100'} transition-opacity duration-500`}>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-sm">2</span> 
              Add-on Services <span className="text-sm font-normal text-slate-500 ml-2">(Optional)</span>
            </h2>
            
            <div className="bg-[#131929] border border-slate-700/50 rounded-2xl overflow-hidden divide-y divide-slate-700/50">
              {services.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No extra services available.
                </div>
              )}
              {services.map(service => {
                const qty = selectedServices[service.id] || 0;
                const isSelected = qty > 0;

                return (
                  <div key={service.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors ${isSelected ? 'bg-primary-900/10' : 'hover:bg-white/[0.02]'}`}>
                    <div className="flex gap-4">
                      <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isSelected ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                        {service.type.toLowerCase().includes('service') ? <Layers size={20} /> : <Zap size={20} />}
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">{service.name}</h4>
                        <p className="text-slate-400 text-sm">{service.type}</p>
                        <div className="mt-1 font-medium text-emerald-400">
                          + ₹{Number(service.sales_price).toFixed(2)} <span className="text-slate-500 text-sm font-normal">per unit</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-slate-700/50 sm:border-t-0">
                      {isSelected ? (
                        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl p-1 ml-auto sm:ml-0">
                          <button onClick={() => updateServiceQuantity(service.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-300">
                            -
                          </button>
                          <span className="text-white font-medium min-w-[20px] text-center">{qty}</span>
                          <button onClick={() => updateServiceQuantity(service.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-300">
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => toggleService(service.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors ml-auto sm:ml-0 font-medium text-sm"
                        >
                          <PackagePlus size={16} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-6 bg-[#131929] border border-slate-700/50 rounded-3xl p-6 shadow-2xl flex flex-col min-h-[400px]">
            <h3 className="text-lg font-bold text-white mb-6">Order Summary</h3>
            
            <div className="flex-1 space-y-6">
              {!selectedPlanId && (
                <div className="text-center p-6 border border-slate-700/50 border-dashed rounded-xl text-slate-500 h-full flex items-center justify-center">
                  Select a base plan to view your total here.
                </div>
              )}

              {selectedPlan && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start text-sm">
                    <div className="space-y-1">
                      <p className="text-white font-medium">{selectedPlan.name}</p>
                      <p className="text-slate-500 capitalize">{selectedPlan.billing_period} Base Plan</p>
                    </div>
                    <p className="text-white font-semibold">₹{Number(selectedPlan.price).toFixed(2)}</p>
                  </div>
                  
                  {Object.keys(selectedServices).length > 0 && (
                    <div className="pt-4 border-t border-slate-700/50 space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add-ons</p>
                      {Object.entries(selectedServices).map(([id, qty]) => {
                        const svc = services.find(s => s.id === id);
                        if (!svc) return null;
                        return (
                          <div key={id} className="flex justify-between text-sm">
                            <span className="text-slate-300">{svc.name} x {qty}</span>
                            <span className="text-slate-300">₹{(Number(svc.sales_price) * qty).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/50">
              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-400">Total Price</span>
                <div className="text-right">
                  <p className="text-3xl font-black text-white leading-none mb-1">
                    ₹{totalPrice.toFixed(2)}
                  </p>
                  {selectedPlan && (
                    <p className="text-slate-500 text-xs">/ {selectedPlan.billing_period}</p>
                  )}
                </div>
              </div>

              <button
                disabled={!selectedPlanId || submitting}
                onClick={handleSubscribe}
                className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                  ${(!selectedPlanId || submitting) 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-glow hover:-translate-y-1'
                  }`}
              >
                {submitting ? 'Creating Subscription...' : 'Subscribe Now'}
                {!submitting && <ChevronRight size={18} />}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <CreditCard size={14} /> Payments processed securely via Razorpay
              </div>
            </div>
          </div>
        </div>

      </div>
      <Toast toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
