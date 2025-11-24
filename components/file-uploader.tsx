"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface FileUploaderProps {
  onImageUpload: (file: File, url: string) => void;
  uploadedImage: { url: string; file: File } | null;
  handleImageRemove: () => void;
}

export default function FileUploader({
  onImageUpload,
  uploadedImage,
  handleImageRemove,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      onImageUpload(file, data.url);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {uploadedImage?.url ? (
        <Card className="p-3 relative inline-block">
          <div className="relative w-40 h-40">
            <Image
              src={uploadedImage.url || "/placeholder.svg"}
              alt="Preview"
              fill
              className="object-cover rounded"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
            onClick={() => {
              handleImageRemove();
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            <X className="h-2 w-2" />
          </Button>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          e.target.files?.[0] && handleFileSelect(e.target.files[0])
        }
      />
    </div>
  );
}
