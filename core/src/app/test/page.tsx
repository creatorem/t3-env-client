export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tailwind Test</h1>
        <div className="space-y-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Red alert box
          </div>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Green success box
          </div>
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Yellow warning box
          </div>
        </div>
      </div>
    </div>
  );
}