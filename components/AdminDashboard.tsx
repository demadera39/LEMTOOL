import React, { useEffect, useState } from 'react';
import { getLeads, signOut } from '../services/supabaseService';
import { Lead, User } from '../types';
import { LogOut, Users, FileText, AlertTriangle, Shield } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const data = await getLeads();
        setLeads(data);
      } catch (err) {
        console.error("Failed to fetch leads", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="font-black text-lem-orange text-2xl tracking-tighter">LEM</div>
          <span className="text-sm font-bold text-gray-400">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-orange-100 rounded-lg text-lem-orange">
                 <Users size={20} />
               </div>
               <span className="text-sm font-bold text-gray-500 uppercase">Total Leads</span>
             </div>
             <div className="text-3xl font-black text-gray-900">{leads.length}</div>
           </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-bold text-gray-900">Recent Report Requests</h2>
          </div>
          
          {loading ? (
             <div className="p-8 text-center text-gray-500">Loading leads...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Website Analyzed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                      <td className="px-6 py-4 text-gray-600">{lead.email}</td>
                      <td className="px-6 py-4">
                        <a href={lead.website_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {lead.website_url}
                          <FileText size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400 max-w-md mx-auto">
                           <p className="mb-4">No leads captured yet (or hidden).</p>
                           
                           {/* Troubleshooting Guide for RLS */}
                           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left text-yellow-800 text-xs">
                              <div className="flex items-center gap-2 font-bold mb-2">
                                 <AlertTriangle size={14} />
                                 <span>Don't see leads? It's likely RLS.</span>
                              </div>
                              <p className="mb-2">
                                 Supabase hides data from anonymous users by default. Since you are using the "Backdoor Login", you are technically an anonymous guest.
                              </p>
                              <p className="font-bold mb-1">How to Fix in Supabase Dashboard:</p>
                              <ol className="list-decimal list-inside space-y-1 ml-1">
                                 <li>Go to <span className="font-semibold">Authentication {'>'} Policies</span></li>
                                 <li>Find the <span className="font-mono bg-yellow-100 px-1">leads</span> table</li>
                                 <li>Click <span className="font-semibold">New Policy</span></li>
                                 <li>Select <span className="font-semibold">"Enable read access for all users"</span></li>
                                 <li>Ensure "Target roles" includes <span className="font-mono">anon</span> or <span className="font-mono">public</span></li>
                                 <li>Click <span className="font-semibold">Save Policy</span></li>
                              </ol>
                           </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;