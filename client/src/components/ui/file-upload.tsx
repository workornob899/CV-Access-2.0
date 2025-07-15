import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize?: number;
  preview?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  onFileSelect,
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  preview = false,
  className,
  children,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    if (preview && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors duration-200",
        dragActive ? "border-blue-500 bg-blue-50" : "hover:border-gray-400",
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="space-y-4">
          {previewUrl ? (
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg mx-auto"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                onClick={removeFile}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <FileText className="w-8 h-8 text-gray-500" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {Math.round(selectedFile.size / 1024)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div onClick={openFileDialog} className="cursor-pointer">
          {children || (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Max file size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
