"use client";

import { useEffect, useState } from "react";

interface EnvFile {
  exists: boolean;
  path: string;
  variables?: string[];
  content?: string;
  error?: string;
}

interface EnvData {
  projectPath: string;
  files: Record<string, EnvFile>;
  variables: Record<string, string>;
  processEnv: Record<string, string>;
}

export default function Home() {
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnvData = async () => {
      try {
        const response = await fetch("/api/env");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEnvData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load environment data");
      } finally {
        setLoading(false);
      }
    };

    fetchEnvData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-800 mb-2">Error Loading Environment Data</h1>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!envData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Environment Variables Dashboard</h1>
          <p className="text-gray-600">Project: {envData.projectPath}</p>
        </div>

        {/* Environment Files */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Files</h2>
          <div className="grid gap-4">
            {Object.entries(envData.files).map(([fileName, file]) => (
              <div
                key={fileName}
                className={`border rounded-lg p-4 ${
                  file.exists
                    ? file.error
                      ? "border-red-200 bg-red-50"
                      : "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-mono text-sm font-medium">{fileName}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      file.exists
                        ? file.error
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {file.exists ? (file.error ? "Error" : "Found") : "Missing"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-mono">{file.path}</p>
                {file.error && (
                  <p className="text-sm text-red-600 mt-2">{file.error}</p>
                )}
                {file.variables && file.variables.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Variables: {file.variables.length} ({file.variables.join(", ")})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Loaded Variables ({Object.keys(envData.variables).length})
          </h2>
          {Object.keys(envData.variables).length === 0 ? (
            <p className="text-gray-500 italic">No environment variables found in .env files</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Variable</th>
                    <th className="text-left py-2 px-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(envData.variables).map(([key, value]) => (
                    <tr key={key} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono font-medium text-blue-600">{key}</td>
                      <td className="py-2 px-3 font-mono text-gray-700">
                        {value.length > 50 ? `${value.substring(0, 50)}...` : value || "(empty)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Process Environment */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Process Environment ({Object.keys(envData.processEnv).length} variables)
          </h2>
          <details className="group">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              Click to view process environment variables
            </summary>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Variable</th>
                    <th className="text-left py-2 px-3 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(envData.processEnv).map(([key, value]) => (
                    <tr key={key} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono font-medium text-purple-600">{key}</td>
                      <td className="py-2 px-3 font-mono text-gray-700 break-all">
                        {value && value.length > 50 ? `${value.substring(0, 50)}...` : value || "(empty)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
