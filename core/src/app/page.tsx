import { getEnvConfigData } from "../lib/env-data";
import { getEnvVariables } from "../lib/env-variables";
import { getEnvsSchema } from "../lib/envs-schema";

async function getServerSideData(): Promise<{ 
  schema: Record<string, any> | null; 
  variables: Record<string, string> | null;
}> {
  try {
    // Get the project directory from global variable set by the server
    const projectDir = global.__PROJECT_DIR__;
    if (!projectDir) {
      throw new Error("Project directory not available");
    }
    
    const envConfigData = await getEnvConfigData(projectDir);
    const envVariables = await getEnvVariables(projectDir);
    
    // Get envs schema using config data
    const envsSchemaResult = await getEnvsSchema(envConfigData);
    
    return { 
      schema: envsSchemaResult.schema || null, 
      variables: envVariables 
    };
  } catch (error) {
    console.error("Failed to load environment data:", error);
    return { schema: null, variables: null };
  }
}

export default async function Home() {
  const { schema, variables } = await getServerSideData();
  console.log({ schema, variables });

  if (!variables) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-xl font-bold text-red-800 mb-2">Error Loading Environment Data</h1>
            <p className="text-red-600">Failed to load environment configuration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Environment Variables Dashboard</h1>
          <p className="text-gray-600">Variables loaded: {Object.keys(variables).length}</p>
        </div>

        {/* Envs Schema Analysis */}
        {schema && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Envs Schema Analysis</h2>
            <div className="border rounded-lg p-4 border-green-200 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-mono text-sm font-medium">Schema Extraction Status</h3>
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  Success
                </span>
              </div>
              
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-green-100 rounded">
                  <p className="text-sm font-medium text-green-700 mb-1">✅ Schema extracted successfully</p>
                  <p className="text-xs text-green-600">Environment variable schemas are available</p>
                </div>
                
                {/* Client Schema */}
                {schema.client && Object.keys(schema.client).length > 0 && (
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-700 mb-2">Client Variables ({Object.keys(schema.client).length})</p>
                      <div className="text-xs text-blue-600 space-y-1">
                        {Object.keys(schema.client).map(key => (
                          <div key={key} className="font-mono">{key}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Server Schema */}
                  {schema.server && Object.keys(schema.server).length > 0 && (
                    <div className="p-3 bg-purple-50 rounded">
                      <p className="text-sm font-medium text-purple-700 mb-2">Server Variables ({Object.keys(schema.server).length})</p>
                      <div className="text-xs text-purple-600 space-y-1">
                        {Object.keys(schema.server).map(key => (
                          <div key={key} className="font-mono">{key}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Shared Schema */}
                  {schema.shared && Object.keys(schema.shared).length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded">
                      <p className="text-sm font-medium text-yellow-700 mb-2">Shared Variables ({Object.keys(schema.shared).length})</p>
                      <div className="text-xs text-yellow-600 space-y-1">
                        {Object.keys(schema.shared).map(key => (
                          <div key={key} className="font-mono">{key}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
        )}

        {/* Environment Variables */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Environment Variables ({Object.keys(variables).length})
          </h2>
          {Object.keys(variables).length === 0 ? (
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
                  {Object.entries(variables).map(([key, value]) => (
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
      </div>
    </div>
  );
}
