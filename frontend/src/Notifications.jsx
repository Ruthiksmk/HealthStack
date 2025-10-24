import React, { useEffect, useState } from "react";

function Notifications({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    fetch(`http://localhost:3001/api/notifications?email=${userEmail}`)
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [userEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 text-lg">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-b from-blue-50 to-white shadow-lg rounded-2xl mt-6">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        🔔 Notifications Center
      </h2>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No notifications yet 🎉</p>
          <p className="text-sm text-gray-400">You’ll see updates here soon.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={`p-4 transition-all duration-300 hover:scale-[1.01] hover:bg-blue-100 rounded-xl mb-2 shadow-sm ${
                n.read ? "bg-gray-100" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">{n.title}</h3>
                <span
                  className={`text-xs font-medium ${
                    n.read ? "text-gray-400" : "text-blue-500"
                  }`}
                >
                  {new Date(n.date).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 mt-2">{n.message}</p>

              <button
                onClick={() => {
                  fetch(`http://localhost:3001/api/notifications/${n._id}/read`, {
                    method: "PUT",
                  })
                    .then(() => {
                      setNotifications((prev) =>
                        prev.map((notif) =>
                          notif._id === n._id ? { ...notif, read: true } : notif
                        )
                      );
                    })
                    .catch(console.error);
                }}
                disabled={n.read}
                className={`mt-3 px-3 py-1 text-sm rounded-lg transition ${
                  n.read
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {n.read ? "Read" : "Mark as Read"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Notifications;
