import React, { useState, useRef } from 'react';
//import './FileUpload.scss';

const FileUpload = ({ 
  label,
  acceptedTypes = [],
  maxSize = 10 * 1024 * 1024, // 10MB
  onFileChange,
  error,
  className = '',
  ...props
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`;
    }
    
    // Check file type if acceptedTypes is provided
    if (acceptedTypes.length > 0) {
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!acceptedTypes.includes(fileExtension)) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
      }
    }
    
    return null;
  };

  const handleFile = (file) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setFileError(validationError);
      return;
    }
    
    setFileError('');
    onFileChange(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleButtonClick = () => {
    inputRef.current.click();
  };

  const containerClasses = [
    'file-upload-container',
    dragActive ? 'drag-active' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label>{label}</label>}
      
      <div 
        className="drop-area"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          accept={acceptedTypes.join(',')}
          {...props}
        />
        
        <div className="upload-message">
          <i className="upload-icon">📁</i>
          <p>
            Drag and drop a file here, or <span className="browse">browse</span>
          </p>
          {acceptedTypes.length > 0 && (
            <p className="accepted-types">
              Accepted file types: {acceptedTypes.join(', ')}
            </p>
          )}
        </div>
      </div>
      
      {(fileError || error) && (
        <div className="error-message">{fileError || error}</div>
      )}
    </div>
  );
};

export default FileUpload;