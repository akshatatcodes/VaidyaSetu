"use client";
import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

export default function SettingsPage() {
  const { userId, isLoaded } = useAuth();
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:5000/api/user/${userId}`)
        .then(res => {
          if (!res.ok) throw new Error("Backend route missing");
          return res.json();
        })
        .then(data => {
          if (data && data.status === "success" && data.data) {
            setAge(data.data.age || "");
            setHeight(data.data.height || "");
            setWeight(data.data.weight || "");
          }
        });
    }
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("http://localhost:5000/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerkId: userId, age: Number(age), height: Number(height), weight: Number(weight) })
      });
      setMsg("Profile saved successfully!");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg("Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="p-8 text-gray-500 animate-pulse">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 block">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
          <Settings className="w-10 h-10 mr-4 text-emerald-500" /> Profile Settings
        </h1>
        <p className="text-gray-400 text-lg">Update your physical metrics to maintain personalized accuracy.</p>
      </header>

      {!userId ? (
        <div className="p-10 border border-gray-800 rounded-2xl bg-gray-900 text-center text-gray-500">
          Sign in to access and modify your settings.
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-xl">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Personal Metrics</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Age</label>
              <input required type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Height (cm)</label>
              <input required type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Weight (kg)</label>
              <input required type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            
            <div className="pt-4 flex items-center justify-between border-t border-gray-800">
              <span className={`text-sm ${msg.includes("Failed") ? "text-red-500" : "text-emerald-500"}`}>{msg}</span>
              <button disabled={loading} type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg flex items-center font-bold transition-colors disabled:opacity-50">
                <Save className="w-5 h-5 mr-2"/>
                {loading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
