import { FileText, Upload } from "lucide-react";

export default function PrescriptionsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
          <FileText className="w-10 h-10 mr-4 text-blue-500" /> Prescriptions & Documents
        </h1>
        <p className="text-gray-400 text-lg">Manage your uploaded medical files and historical prescriptions.</p>
      </header>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
          <Upload className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">OCR Document Upload (Coming down the pipeline)</h2>
        <p className="text-gray-400 max-w-lg mb-8">This module will eventually use Advanced Computer Vision to automatically extract medicines from photos of your prescriptions to pre-populate the Database.</p>
        <button className="bg-blue-600/50 cursor-not-allowed text-white opacity-50 px-6 py-3 rounded-xl font-medium">Upload Image (Locked)</button>
      </div>
    </div>
  );
}
