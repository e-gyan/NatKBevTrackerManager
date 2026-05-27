import React, { useState } from 'react';
import { BookOpen, Package, ShoppingCart, TrendingUp, Settings, Shield, Server, Monitor, AlertTriangle, Printer, FileText, Download, Briefcase, Users, Layers, Zap, ArrowRight, Layout, Smartphone, Code, Palette, Database } from 'lucide-react';

const Documentation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manual' | 'portfolio'>('manual');

  const handlePrint = () => {
    // Timeout ensures React renders any pending state before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const manualSections = [
    { id: 'project-overview', title: '1. Project Overview', page: 2 },
    { id: 'user-manual', title: '2. User Manual & Key Modules', page: 2 },
    { id: 'tech-architecture', title: '3. Technical Architecture', page: 3 },
    { id: 'ux-design', title: '4. UX/UI Design Philosophy', page: 4 },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-24 w-full">
      
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 mb-8 no-print gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="text-primary" size={32} />
            System Documentation
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {activeTab === 'manual' ? 'Live technical reference and user guide.' : 'Product design portfolio and case study.'}
          </p>
        </div>
        <div className="flex gap-3">
            <button 
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-1"
            >
            <Printer size={20} /> 
            <span>Export to PDF</span>
            </button>
        </div>
      </div>

      {/* TAB NAVIGATION (Hidden in Print - The active tab content will print) */}
      <div className="flex space-x-6 mb-8 border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-4 px-2 font-bold text-lg transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'manual' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={20} /> User Manual
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`pb-4 px-2 font-bold text-lg transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'portfolio' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Briefcase size={20} /> UX Case Study
        </button>
      </div>

      {/* ==================================================================================
          TAB 1: USER MANUAL (Original Content)
         ================================================================================== */}
      {activeTab === 'manual' && (
        <div className="animate-fade-in">
             {/* --- PRINT ONLY: COVER PAGE & TOC --- */}
            <div className="hidden print:flex print:flex-col print:h-screen print:justify-center print:items-center print:mb-0">
                <div className="text-center space-y-6 mb-16 w-full">
                    <div className="w-24 h-24 bg-slate-900 rounded-full mx-auto flex items-center justify-center text-white mb-6">
                        <BookOpen size={48} />
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 tracking-tight">BevTracker</h1>
                    <p className="text-2xl text-slate-500 font-light">System Documentation v1.0</p>
                    <div className="w-24 h-1 bg-primary mx-auto my-8"></div>
                    <p className="text-sm text-slate-400">Generated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="border-t border-b border-slate-200 py-8 w-full max-w-xl mx-auto">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 uppercase tracking-widest text-sm">
                        <FileText size={16}/> Table of Contents
                    </h2>
                    <ul className="space-y-4">
                        {manualSections.map(section => (
                            <li key={section.id}>
                                <a href={`#${section.id}`} className="flex items-baseline justify-between hover:text-primary group">
                                <span className="font-medium text-lg text-slate-800">{section.title}</span>
                                <span className="border-b border-dotted border-slate-300 flex-1 mx-4"></span>
                                <span className="text-slate-500 font-mono">pg {section.page}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ pageBreakAfter: 'always' }}></div>
            </div>

            <div className="space-y-10 print:space-y-8">
                {/* 1. Overview */}
                <section id="project-overview" className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:p-0">
                <div className="bg-slate-50 p-6 border-b border-slate-100 print:bg-transparent print:border-b-2 print:border-slate-800 print:px-0 print:pt-0">
                    <h2 className="font-bold text-slate-800 text-xl">1. Project Overview</h2>
                </div>
                <div className="p-8 prose prose-slate max-w-none print:px-0 print:py-4">
                    <p className="text-lg leading-relaxed">
                        <strong>BevTracker</strong> is a comprehensive progressive web application designed to manage the end-to-end operations of a wholesale beverage and provision shop. It moves beyond simple spreadsheets by integrating inventory tracking, point-of-sale (POS) processing, expense management, and AI-driven business intelligence into a single platform.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 my-4 print:border-l-4 print:border-blue-500 print:bg-transparent print:pl-4">
                        <p className="text-blue-800 font-medium m-0">
                            <strong>Core Value:</strong> The system is built to handle both wholesale and retail transactions, catering to the specific needs of managing stock levels, calculating real-time profit margins, and providing insights based on local market trends.
                        </p>
                    </div>
                </div>
                </section>

                {/* 2. Key Modules */}
                <section id="user-manual" className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:p-0">
                <div className="bg-slate-50 p-6 border-b border-slate-100 print:bg-transparent print:border-b-2 print:border-slate-800 print:px-0">
                    <h2 className="font-bold text-slate-800 text-xl">2. User Manual & Key Modules</h2>
                </div>
                <div className="p-8 grid gap-8 md:grid-cols-2 print:grid-cols-1 print:gap-6 print:px-0">
                    
                    <div className="space-y-4">
                        <h3 className="font-bold text-primary flex items-center gap-2 text-lg print:text-black">
                            <Package className="print:hidden" size={24} /> Inventory Management
                        </h3>
                        <ul className="list-disc list-inside text-slate-600 space-y-2 print:text-black">
                            <li><strong>Product CRUD:</strong> Create, Read, Update, and Delete products with details like Cost Price, Sell Price, and Stock Level.</li>
                            <li><strong>Smart Pricing:</strong> The system automatically suggests a sell price (1.4x markup) when adding items.</li>
                            <li><strong>Restock Workflow:</strong> Use the dedicated "Restock" button to add inventory without overriding existing data.</li>
                            <li><strong>Stale Price Alert:</strong> A visual clock icon warns if a price hasn't been updated in 6 months.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-primary flex items-center gap-2 text-lg print:text-black">
                            <ShoppingCart className="print:hidden" size={24} /> Point of Sale (POS)
                        </h3>
                        <ul className="list-disc list-inside text-slate-600 space-y-2 print:text-black">
                            <li><strong>Cart System:</strong> Search and add products to a temporary cart. Supports quantity adjustments and manual discounts.</li>
                            <li><strong>Checkout:</strong> Records a transaction, deducts stock immediately, and logs revenue/profit.</li>
                            <li><strong>Sales History:</strong> View past transactions with date filtering.</li>
                            <li><strong>Voiding:</strong> Reverse transactions to correct errors and restore stock.</li>
                        </ul>
                    </div>

                    <div className="space-y-4 print:break-before-page print:pt-8">
                        <h3 className="font-bold text-primary flex items-center gap-2 text-lg print:text-black">
                            <TrendingUp className="print:hidden" size={24} /> Dashboard & Analytics
                        </h3>
                        <ul className="list-disc list-inside text-slate-600 space-y-2 print:text-black">
                            <li><strong>Time-Based Filtering:</strong> Toggle between 2 Weeks, 1 Month, 1 Quarter, or 1 Year views.</li>
                            <li><strong>Financial Metrics:</strong> Real-time calculation of Net Profit (Revenue - Cost of Goods - Expenses).</li>
                            <li><strong>Inventory Valuation:</strong> Tracks total capital tied up in stock vs. potential revenue.</li>
                        </ul>
                    </div>

                    <div className="space-y-4 print:pt-8">
                        <h3 className="font-bold text-primary flex items-center gap-2 text-lg print:text-black">
                            <Settings className="print:hidden" size={24} /> Configuration
                        </h3>
                        <ul className="list-disc list-inside text-slate-600 space-y-2 print:text-black">
                            <li><strong>Security PIN:</strong> Protects critical settings (API keys, Data Export) from unauthorized access.</li>
                            <li><strong>Wireframe Mode:</strong> A specialized "Low-Fi" toggle for generating blueprint-style screenshots for documentation/prototyping.</li>
                        </ul>
                    </div>
                </div>
                </section>

                {/* 3. Tech Arch */}
                <section id="tech-architecture" className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:break-before-page">
                    <div className="bg-slate-50 p-6 border-b border-slate-100 print:bg-transparent print:border-b-2 print:border-slate-800 print:px-0">
                        <h2 className="font-bold text-slate-800 text-xl">3. Technical Architecture</h2>
                    </div>
                    <div className="p-8 print:px-0">
                        <div className="grid md:grid-cols-3 gap-6 text-sm print:grid-cols-1 print:gap-6">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 print:border-black print:bg-white">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><Monitor size={20}/> Frontend Stack</h4>
                                <ul className="space-y-2 text-slate-600 print:text-black list-disc list-inside">
                                    <li>React 19 (Functional Components)</li>
                                    <li>TypeScript (Strict Typing)</li>
                                    <li>Tailwind CSS (Styling System)</li>
                                    <li>Lucide React (Iconography)</li>
                                    <li>Recharts (Data Visualization)</li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 print:border-black print:bg-white">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><Server size={20}/> Data Persistence</h4>
                                <ul className="space-y-2 text-slate-600 print:text-black list-disc list-inside">
                                    <li><strong>Primary:</strong> Browser LocalStorage (Offline first).</li>
                                    <li><strong>Cloud Sync:</strong> JSONBin.io integration for cross-device backup.</li>
                                    <li><strong>State Management:</strong> React Hooks (useState, useMemo, useEffect).</li>
                                </ul>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 print:border-black print:bg-white">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><Shield size={20}/> Security & AI</h4>
                                <ul className="space-y-2 text-slate-600 print:text-black list-disc list-inside">
                                    <li><strong>Auth:</strong> SHA-256 Hashing for Admin PIN protection.</li>
                                    <li><strong>AI Engine:</strong> Google Gemini API (Flash 2.5/3 model) for business logic analysis.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
      )}


      {/* ==================================================================================
          TAB 2: UX CASE STUDY (Portfolio Content)
         ================================================================================== */}
      {activeTab === 'portfolio' && (
        <div className="animate-fade-in space-y-12">
            
            {/* PRINT ONLY: Portfolio Cover */}
            <div className="hidden print:flex print:flex-col print:h-screen print:justify-center print:items-center print:mb-0">
                <div className="text-center space-y-6 mb-16 w-full">
                    <div className="w-24 h-24 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center text-white mb-6">
                        <Briefcase size={48} />
                    </div>
                    <h1 className="text-5xl font-bold text-slate-900 tracking-tight">BevTracker Case Study</h1>
                    <p className="text-2xl text-slate-500 font-light">Digital Transformation for Local Retail</p>
                    <div className="w-24 h-1 bg-primary mx-auto my-8"></div>
                    <p className="text-sm text-slate-400">Designed & Developed by [Your Name]</p>
                </div>
                <div style={{ pageBreakAfter: 'always' }}></div>
            </div>

            {/* 1. Problem & Solution */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 print:shadow-none print:border-0 print:p-0">
               <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500"/> The Problem
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        Local wholesale and provision shops often rely on <strong>fragmented paper records</strong> or memory to track inventory. This leads to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                        <li><strong>Stockouts:</strong> Not knowing when to restock popular items.</li>
                        <li><strong>Pricing Confusion:</strong> Losing track of cost price vs. sell price during inflation.</li>
                        <li><strong>Invisible Profits:</strong> Inability to calculate true net profit after expenses.</li>
                    </ul>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-500"/> The Solution
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-4">
                        BevTracker is a <strong>Mobile-First Progressive Web App</strong> that centralizes business operations. Key design decisions:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-slate-600 ml-2">
                        <li><strong>Offline-First:</strong> Works without reliable internet.</li>
                        <li><strong>Smart Calculations:</strong> Automates margin calculations (markup logic).</li>
                        <li><strong>One-Tap POS:</strong> Checkout process optimized for mobile touch targets.</li>
                    </ul>
                  </div>
               </div>
            </section>

             {/* 1.5 Tech Stack (New) */}
            <section className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Code className="text-slate-700"/> Technology Stack
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-2"><Layout size={18}/> Frontend</div>
                        <p className="text-sm text-slate-600">React 19, TypeScript, Vite</p>
                    </div>
                    <div className="space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-2"><Palette size={18}/> UI/UX</div>
                        <p className="text-sm text-slate-600">Tailwind CSS, Lucide Icons</p>
                    </div>
                    <div className="space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-2"><Zap size={18}/> AI & Data</div>
                        <p className="text-sm text-slate-600">Google Gemini API, Recharts</p>
                    </div>
                    <div className="space-y-2">
                        <div className="font-bold text-slate-800 flex items-center gap-2"><Database size={18}/> Storage</div>
                        <p className="text-sm text-slate-600">LocalStorage, JSONBin.io</p>
                    </div>
                </div>
            </section>

            {/* 2. User Journey Map */}
            <section className="print:break-before-page">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                   <Users className="text-primary" /> User Journey Flow
                </h2>
                <div className="relative border-l-2 border-slate-200 ml-6 space-y-12">
                    
                    {/* Step 1 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-sm"></div>
                        <h3 className="text-xl font-bold text-slate-800">1. Stock Arrival</h3>
                        <p className="text-slate-500 mt-1">Shop owner receives a new delivery of drinks and provisions.</p>
                        <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <p className="text-sm text-slate-600"><strong>App Action:</strong> Quick Entry &rarr; Auto-Suggest Price (1.4x) &rarr; Print Labels (Optional)</p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-sm"></div>
                        <h3 className="text-xl font-bold text-slate-800">2. Customer Interaction</h3>
                        <p className="text-slate-500 mt-1">Customer selects multiple crates of drinks and asks for a discount.</p>
                        <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <p className="text-sm text-slate-600"><strong>App Action:</strong> Add to Cart &rarr; Apply Manual Discount (10%) &rarr; View Updated Margin instantly.</p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-white shadow-sm"></div>
                        <h3 className="text-xl font-bold text-slate-800">3. End-of-Day Review</h3>
                        <p className="text-slate-500 mt-1">Shop owner closes for the day.</p>
                        <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                           <p className="text-sm text-slate-600"><strong>App Action:</strong> Dashboard Check &rarr; Net Profit Calculation (Sales - Expenses) &rarr; AI Recommendations.</p>
                        </div>
                    </div>

                </div>
            </section>

            {/* 3. Screen Gallery (CSS Mockups) */}
            <section className="print:break-before-page">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                   <Layout className="text-primary" /> Core Interface Design
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* Mockup 1: Dashboard */}
                    <div className="space-y-3">
                        <div className="bg-slate-900 rounded-xl p-2 shadow-xl">
                            {/* Browser Bar */}
                            <div className="flex gap-1 mb-2 px-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                            {/* Screen Content Placeholder */}
                            <div className="bg-slate-100 rounded-lg aspect-video p-4 flex flex-col gap-2 relative overflow-hidden group">
                                <div className="h-4 w-1/3 bg-slate-300 rounded mb-4"></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white h-16 rounded shadow-sm border border-slate-200 p-2">
                                        <div className="h-2 w-8 bg-green-200 rounded mb-1"></div>
                                        <div className="h-4 w-16 bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="bg-white h-16 rounded shadow-sm border border-slate-200 p-2">
                                        <div className="h-2 w-8 bg-blue-200 rounded mb-1"></div>
                                        <div className="h-4 w-16 bg-slate-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="mt-2 bg-white flex-1 rounded shadow-sm border border-slate-200 relative">
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-widest opacity-20 rotate-12">
                                        Dashboard View
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-center">Executive Dashboard</h4>
                        <p className="text-xs text-slate-500 text-center">High-level metrics (Sales, Profit, Inventory) available at a glance.</p>
                    </div>

                    {/* Mockup 2: POS */}
                    <div className="space-y-3">
                        <div className="bg-slate-900 rounded-[2rem] p-3 shadow-xl w-3/4 mx-auto border-4 border-slate-800">
                             {/* Mobile Notch */}
                             <div className="h-4 w-20 bg-black mx-auto rounded-b-xl mb-2"></div>
                             {/* Screen Content */}
                             <div className="bg-white rounded-xl aspect-[9/16] p-3 flex flex-col relative overflow-hidden">
                                <div className="flex justify-between items-center mb-4 border-b pb-2">
                                    <div className="h-3 w-10 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-4 rounded-full bg-slate-200"></div>
                                </div>
                                <div className="space-y-2 flex-1">
                                    <div className="bg-slate-50 p-2 rounded flex justify-between">
                                        <div className="h-2 w-12 bg-slate-300 rounded"></div>
                                        <div className="h-2 w-8 bg-slate-300 rounded"></div>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded flex justify-between">
                                        <div className="h-2 w-12 bg-slate-300 rounded"></div>
                                        <div className="h-2 w-8 bg-slate-300 rounded"></div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between mb-2">
                                        <div className="h-2 w-8 bg-slate-300 rounded"></div>
                                        <div className="h-3 w-12 bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="h-10 w-full bg-primary rounded-lg"></div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-widest opacity-20 -rotate-12">
                                    Mobile POS
                                </div>
                             </div>
                        </div>
                        <h4 className="font-bold text-slate-800 text-center">Mobile Point of Sale</h4>
                        <p className="text-xs text-slate-500 text-center">Optimized for handheld usage on the shop floor.</p>
                    </div>
                </div>
            </section>

            {/* 4. Impact */}
            <section className="bg-slate-900 text-white rounded-2xl p-8 print:bg-white print:text-black print:border print:border-slate-200">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp /> Business Impact
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <div className="text-4xl font-bold text-primary">100%</div>
                        <h4 className="font-bold">Digital Tracking</h4>
                        <p className="text-sm text-slate-400 print:text-slate-600">Eliminated paper loss and calculation errors completely.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl font-bold text-primary">2hrs</div>
                        <h4 className="font-bold">Weekly Savings</h4>
                        <p className="text-sm text-slate-400 print:text-slate-600">Reduced time spent on manual inventory reconciliation.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-4xl font-bold text-primary">AI</div>
                        <h4 className="font-bold">Strategy</h4>
                        <p className="text-sm text-slate-400 print:text-slate-600">Leveraging Gemini AI for stock forecasting and seasonal bundles.</p>
                    </div>
                </div>
            </section>
        </div>
      )}

    </div>
  );
};

export default Documentation;