export default function TestWidget() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Widget Test Page
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This page is for testing the AI chat widget. Look for the chat bubble in the bottom right corner.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The widget should appear as a floating button in the bottom corner.
              Click it to open the chat interface.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sample Content</h2>
            
            <p className="text-gray-700 leading-relaxed">
              This is a public-facing test page. The AI chat widget should load here because
              this page is NOT under the /admin path.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-purple-900 mb-2">Feature 1</h3>
                <p className="text-purple-800">
                  Interactive chat widget with AI-powered responses
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-100 to-teal-100 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-green-900 mb-2">Feature 2</h3>
                <p className="text-green-800">
                  Customizable appearance and behavior
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">Feature 3</h3>
                <p className="text-yellow-800">
                  Embeddable on any website
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Feature 4</h3>
                <p className="text-blue-800">
                  Real-time message handling
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Test:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Make sure the widget is enabled in the admin panel (/admin/widget)</li>
                <li>Check that "Widget Active" toggle is ON</li>
                <li>Look for the chat bubble in the bottom right corner of this page</li>
                <li>Click the bubble to open the chat interface</li>
                <li>Type a message to test the AI response</li>
              </ol>
            </div>

            <div className="mt-6 flex gap-4">
              <a 
                href="/admin/widget" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Go to Widget Settings
              </a>
              <a 
                href="/admin" 
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
              >
                Go to Admin Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Add some extra content to test scrolling */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Additional Content</h2>
          <p className="text-gray-600 mb-4">
            Scroll down to see how the widget stays fixed in position.
          </p>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <p key={i} className="text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
