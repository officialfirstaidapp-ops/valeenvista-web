import React from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Calendar } from 'lucide-react';

const RecentUsers = ({ users }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Users</h2>
        <Link to="/admin/users" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent users</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                user.role === 'broker' ? 'bg-blue-100 text-blue-800' :
                user.role === 'agent' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {user.role}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentUsers;