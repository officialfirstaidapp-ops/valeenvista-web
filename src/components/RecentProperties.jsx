import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MapPin } from 'lucide-react';

const RecentProperties = ({ properties }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Recent Properties</h2>
        <Link to="/admin/properties" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {properties.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent properties</p>
        ) : (
          properties.map((property) => (
            <div key={property.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Home size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{property.title}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin size={14} className="mr-1" />
                    {property.location}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">{formatPrice(property.price)}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  property.status === 'available' ? 'bg-green-100 text-green-800' :
                  property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {property.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentProperties;