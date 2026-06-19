"use client";

import { useState } from "react";

export default function ConfigManager() {
  const [formData, setFormData] = useState({
    device_id: "",
    firebase_api_key: "",
    firebase_url: "",
    ip_address: "",
    gateway: "",
    subnet: "",
  });

  const [message, setMessage] = useState({
    text: "",
    type: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(`https://esp32server-xrnm.onrender.com/api/setConfig`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({
          text: "Saved Successfully",
          type: "success",
        });

        // ෆෝම් එක සේව් වුණාට පස්සේ හිස් කිරීම
        setFormData({
          device_id: "",
          firebase_api_key: "",
          firebase_url: "",
          ip_address: "",
          gateway: "",
          subnet: "",
        });
      } else {
        setMessage({
          text: "Save Failed",
          type: "error",
        });
      }
    } catch (error) {
      console.error(error);

      setMessage({
        text: "Connection Error",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" flex flex-wrap ">
      <div className="p-4 w-full flex flex-wrap justify-center">
        <h1 className="text-2xl font-bold text-center mb-6 text-black">Counters Device Configation Manager</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="device_id" placeholder="Machine_01" value={formData.device_id} onChange={handleChange} required className="w-full border p-2 rounded text-black" />

          <input type="text" name="firebase_api_key" placeholder="Firebase API Key" value={formData.firebase_api_key} onChange={handleChange} className="w-full border p-2 rounded text-black" />

          <input type="text" name="firebase_url" placeholder="Firebase URL" value={formData.firebase_url} onChange={handleChange} className="w-full border p-2 rounded text-black" />

          <input type="text" name="ip_address" placeholder="IP Address (e.g. 192.168.0.214)" value={formData.ip_address} onChange={handleChange} className="w-full border p-2 rounded text-black" />

          <input type="text" name="gateway" placeholder="Gateway (e.g. 192.168.0.1)" value={formData.gateway} onChange={handleChange} className="w-full border p-2 rounded text-black" />

          <input type="text" name="subnet" placeholder="Subnet (e.g. 255.255.255.0)" value={formData.subnet} onChange={handleChange} className="w-full border p-2 rounded text-black" />

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </form>

        {message.text && (
          <div className={`mt-4 p-3 rounded font-medium ${message.type === "success" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
