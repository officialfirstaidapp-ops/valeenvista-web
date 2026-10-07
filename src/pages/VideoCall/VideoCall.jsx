import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, Video, Copy, Check } from 'lucide-react';
import Navbar from '../../components/Navbar';

const VideoCall = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  useEffect(() => {
    // Small delay so the iframe has time to initialize
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [roomName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jitsiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <Navbar />

      {/* Header bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-pastel-green dark:border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-light-text dark:text-gray-400 hover:text-soft-green transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <span className="text-dark-text dark:text-white font-semibold flex items-center gap-2">
            <Video size={18} className="text-soft-green" />
            Video Call
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-soft-green text-white rounded-lg hover:bg-warm-orange transition text-sm font-medium"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
      </div>

      {/* Jitsi iframe */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader className="animate-spin text-soft-green mx-auto mb-4" size={48} />
              <p className="text-light-text dark:text-gray-400">
                Loading video call...
              </p>
            </div>
          </div>
        )}

        <iframe
          title="Jitsi Video Call"
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0 absolute inset-0"
        />
      </div>
    </div>
  );
};

export default VideoCall;