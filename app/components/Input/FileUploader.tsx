// app/components/Input/FileUploader.tsx
// File upload handler with drag-and-drop support

'use client';

import { useRef } from 'react';

interface FileUploaderProps {
  onFileUpload: (content: string) => void;
  disabled?: boolean;
}

export default function FileUploader({ 
  onFileUpload, 
  disabled = false 
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      dropZoneRef.current?.classList.add('border-blue-400', 'bg-blue-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      dropZoneRef.current?.classList.remove('border-blue-400', 'bg-blue-50');
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;

    dropZoneRef.current?.classList.remove('border-blue-400', 'bg-blue-50');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum size is 5MB.');
        return;
      }

      // Validate file type
      const validTypes = [
        'text/plain',
        'text/markdown',
        'application/pdf',
      ];
      
      const validExtensions = ['.txt', '.md', '.pdf'];
      const hasValidExtension = validExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!validTypes.includes(file.type) && !hasValidExtension) {
        alert('Please upload a TXT, MD, or PDF file.');
        return;
      }

      // Read file
      const content = await file.text();
      
      if (!content.trim()) {
        alert('File appears to be empty.');
        return;
      }

      onFileUpload(content);
    } catch (error) {
      console.error('[FileUploader] Error processing file:', error);
      alert('Error reading file. Please try again.');
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed border-gray-300 rounded-lg p-6 text-center
          transition-colors cursor-pointer
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-50'
              : 'hover:border-gray-400 hover:bg-gray-50 active:bg-blue-50'
          }
        `}
      >
        <p className="text-2xl mb-2">📁</p>
        <p className={`font-medium ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
          {disabled ? 'Upload disabled' : 'Upload file'}
        </p>
        <p className={`text-sm mt-1 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
          TXT, MD, or PDF (max 5MB)
        </p>
        {!disabled && (
          <p className="text-xs text-gray-500 mt-2">
            or drag and drop your file here
          </p>
        )}
      </div>
    </div>
  );
}