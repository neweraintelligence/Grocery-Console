import React, { useState, useRef, useEffect } from 'react';

interface ItemImageUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
  itemName: string;
}

export const ItemImageUpload: React.FC<ItemImageUploadProps> = ({
  isOpen,
  onClose,
  onSave,
  itemName,
}) => {
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize camera when modal opens in camera mode
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(imageUrl);
      stopCamera();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError('Error reading file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (preview) {
      onSave(preview);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setError(null);
    stopCamera();
    setMode('camera');
    onClose();
  };

  const handleRetake = () => {
    setPreview(null);
    if (mode === 'camera') {
      startCamera();
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '1.5rem',
          padding: '2rem',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '100%',
          maxWidth: '500px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              color: 'white',
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600',
            }}
          >
            Add Photo: {itemName}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: 'white',
              fontSize: '1.5rem',
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {!preview ? (
          <>
            {mode === 'camera' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '4/3',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      backdropFilter: 'blur(8px)',
                      maxWidth: '90%',
                    }}
                  >
                    Point your camera close to the object
                  </div>
                </div>
                {error && (
                  <div
                    style={{
                      color: '#f87171',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(248, 113, 113, 0.1)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(248, 113, 113, 0.2)',
                    }}
                  >
                    {error}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    onClick={() => setMode('upload')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    Upload Instead
                  </button>
                  <button
                    onClick={capturePhoto}
                    style={{
                      padding: '0.75rem 2rem',
                      backgroundColor: '#3b82f6',
                      border: 'none',
                      color: 'white',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    Capture Photo
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.2)',
                    borderRadius: '1rem',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '3rem',
                      marginBottom: '1rem',
                    }}
                  >
                    📁
                  </div>
                  <div
                    style={{
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '500',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Click to select an image
                  </div>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.875rem',
                    }}
                  >
                    or drag and drop
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {error && (
                  <div
                    style={{
                      color: '#f87171',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(248, 113, 113, 0.1)',
                      borderRadius: '0.5rem',
                      border: '1px solid rgba(248, 113, 113, 0.2)',
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  onClick={() => setMode('camera')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  Use Camera Instead
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                borderRadius: '1rem',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={handleRetake}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                Retake
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.75rem 2rem',
                  backgroundColor: '#10b981',
                  border: 'none',
                  color: 'white',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                Save Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
