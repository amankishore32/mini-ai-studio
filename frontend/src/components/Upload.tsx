import React, { useRef } from "react";
import { Upload as UploadIcon } from "lucide-react";

interface UploadProps {
  imagePreview: string;
  disabled?: boolean;
  onSelect: (file: File) => void;
}

const Upload: React.FC<UploadProps> = ({
  imagePreview,
  disabled,
  onSelect,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Image
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleChange}
        className="hidden"
        id="image-upload"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-purple-500 transition-colors focus:ring-2 focus:ring-purple-500"
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <UploadIcon className="w-12 h-12" />
            <span className="text-sm">Click to upload image</span>
            <span className="text-xs text-gray-400">Max 10MB • JPEG/PNG</span>
          </div>
        )}
      </button>
    </div>
  );
};

export default Upload;
