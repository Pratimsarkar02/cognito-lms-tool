// ExamResults.jsx
const ExamResults = () => {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Total Exams:</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex justify-between">
              <span>Average Score:</span>
              <span className="font-medium">85%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="py-2">DBMS IA1</td>
                <td className="py-2 text-right">18/20</td>
                <td className="py-2 text-right">90%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;