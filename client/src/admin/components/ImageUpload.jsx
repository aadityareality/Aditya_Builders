import { useState, useEffect, useRef } from "react";
import { FiPlus, FiTrash2, FiImage } from "react-icons/fi";
import toast from "react-hot-toast";

/**
 * ImageUpload Component
 * Real working image uploader supporting single or multiple file selections,
 * drag-and-drop, client-side validation (5MB max, MIME checks), and blob preview cleanup.
 */
export default function ImageUpload({
  label = "Upload Image",
  value = "", // string URL (single image)
  onChange, // single callback: (file, previewUrl)
  description = "Supports JPG, PNG, WEBP (Max 5MB)",
  isMultiple = false,
  galleryValues = [], // array of { url, file, publicId } (multiple images)
  onGalleryChange, // multiple callback: (updatedGalleryArray)
  maxCount = 10,
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Track created blob URLs to revoke them and prevent memory leaks
  const createdUrlsRef = useRef(new Set());

  const createPreviewUrl = (file) => {
    const url = URL.createObjectURL(file);
    createdUrlsRef.current.add(url);
    return url;
  };

  useEffect(() => {
    // Revoke all blob URLs when component unmounts
    return () => {
      createdUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const validateFile = (file) => {
    if (!file.mimetype && !file.type.startsWith("image/")) {
      toast.error(`"${file.name}" is not a valid image file.`);
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`"${file.name}" exceeds the 5MB size limit.`);
      return false;
    }
    return true;
  };

  const handleFilesSelection = (filesList) => {
    const validFiles = Array.from(filesList).filter(validateFile);
    if (validFiles.length === 0) return;

    if (isMultiple) {
      const currentCount = galleryValues.length;
      if (currentCount + validFiles.length > maxCount) {
        toast.error(`You can upload a maximum of ${maxCount} images.`);
        return;
      }

      const newItems = validFiles.map((file) => {
        const previewUrl = createPreviewUrl(file);
        return {
          url: previewUrl,
          file,
          publicId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
      });

      onGalleryChange([...galleryValues, ...newItems]);
      toast.success(`Added ${validFiles.length} image(s) to gallery queue`);
    } else {
      // Single upload mode
      const file = validFiles[0];
      const previewUrl = createPreviewUrl(file);
      onChange(file, previewUrl);
      toast.success("Image selected");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      handleFilesSelection(e.target.files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelection(e.dataTransfer.files);
    }
  };

  const handleRemoveSingle = () => {
    if (value && value.startsWith("blob:")) {
      URL.revokeObjectURL(value);
      createdUrlsRef.current.delete(value);
    }
    onChange(null, "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveGalleryItem = (idxToRemove) => {
    const item = galleryValues[idxToRemove];
    if (item.url && item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
      createdUrlsRef.current.delete(item.url);
    }
    const updated = galleryValues.filter((_, idx) => idx !== idxToRemove);
    onGalleryChange(updated);
  };

  return (
    <div className="flex flex-col gap-2 text-left w-full">
      <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider">
        {label}
      </label>

      {/* Multiple Image / Gallery View */}
      {isMultiple ? (
        <div className="flex flex-col gap-3">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 border-2 border-dashed rounded-2xl transition-all duration-200 ${
              isDragActive
                ? "border-[#F5A623] bg-amber-50/20"
                : "border-amber-100/70 bg-[#FFFBF5]/10"
            }`}
          >
            {galleryValues.map((img, idx) => (
              <div
                key={img.publicId || idx}
                className="relative aspect-square rounded-xl overflow-hidden border border-amber-100 bg-amber-50/20 group shadow-sm"
              >
                <img
                  src={img.url}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Upload status indicator for local files */}
                {img.file && (
                  <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Queue
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveGalleryItem(idx)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                >
                  <div className="p-2 bg-red-650 hover:bg-red-700 rounded-lg text-white">
                    <FiTrash2 className="w-4 h-4" />
                  </div>
                </button>
              </div>
            ))}

            {galleryValues.length < maxCount && (
              <label className="aspect-square border-2 border-dashed border-amber-200 hover:border-[#F5A623] bg-amber-50/10 hover:bg-amber-50/30 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 select-none">
                <FiPlus className="w-5 h-5 text-[#E8871E]" />
                <span className="text-[10px] font-bold text-[#E8871E] uppercase tracking-wide">
                  Add Photo
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <span className="text-[9px] text-[#6B625A]/60">{description} (Up to {maxCount} files)</span>
        </div>
      ) : (
        /* Single Image Upload View */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all duration-200 ${
            isDragActive
              ? "border-[#F5A623] bg-amber-50/20"
              : "border-amber-100/70 bg-[#FFFBF5]/15"
          }`}
        >
          {value ? (
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-100 bg-amber-50 shrink-0 shadow-sm relative group">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              
              {/* Queue badge for local files */}
              {value.startsWith("blob:") && (
                <div className="absolute bottom-1 right-1 bg-amber-500 text-white font-bold text-[7px] px-1 py-0.5 rounded-full uppercase tracking-widest">
                  New
                </div>
              )}

              <button
                type="button"
                onClick={handleRemoveSingle}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/20 shrink-0 flex flex-col items-center justify-center text-[#6B625A]/45">
              <FiImage className="w-5 h-5" />
            </div>
          )}

          <div className="flex-grow flex flex-col gap-1.5 text-left">
            <div className="flex items-center gap-2">
              <label className="inline-block px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-bold text-[#E8871E] transition-colors cursor-pointer select-none border border-amber-150">
                Choose Image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {value && (
                <button
                  type="button"
                  onClick={handleRemoveSingle}
                  className="text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  Remove
                </button>
              )}
            </div>
            <span className="text-[9px] text-[#6B625A]/65">{description}</span>
          </div>
        </div>
      )}
    </div>
  );
}
