"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Upload, Loader2, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { PresentationGenerationApi } from "../services/api/presentation-generation";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PreviousGeneratedImagesResponse } from "../services/api/params";
import { trackEvent, MixpanelEvent } from "@/utils/mixpanel";
import { ImagesApi } from "../services/api/images";
import { ImageAssetResponse } from "../services/api/types";
interface ImageEditorProps {
  initialImage: string | null;
  imageIdx?: number;
  slideIndex: number;
  className?: string;
  promptContent?: string;
  properties?: null | any;
  onClose?: () => void;
  onImageChange?: (newImageUrl: string, prompt?: string) => void;
  onFocusPointClick?: (propertiesData: any) => void;
  isDarkMode?: boolean;
}

const ImageEditor = ({
  initialImage,
  imageIdx = 0,
  promptContent,
  properties,
  onClose,
  onFocusPointClick,
  onImageChange,
  isDarkMode = false,
}: ImageEditorProps) => {
  // State management
  const [previewImages, setPreviewImages] = useState(initialImage);
  const [previousGeneratedImages, setPreviousGeneratedImages] = useState<
    PreviousGeneratedImagesResponse[]
  >([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<ImageAssetResponse[]>([]);
  const [uploadedImagesLoading, setUploadedImagesLoading] = useState(false);
  // Focus point and object fit for image editing
  const [isFocusPointMode, setIsFocusPointMode] = useState(false);
  const [focusPoint, setFocusPoint] = useState(
    (properties &&
      properties[imageIdx] &&
      properties[imageIdx].initialFocusPoint) || {
      x: 50,
      y: 50,
    }
  );
  const [objectFit, setObjectFit] = useState<"cover" | "contain" | "fill">(
    (properties &&
      properties[imageIdx] &&
      properties[imageIdx].initialObjectFit) ||
      "cover"
  );

  // Refs
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Normalize the path when initialImage changes
    let normalized: string | null = null;
    if (initialImage) {
      // If it's a full URL, extract just the path
      if (initialImage.startsWith('http://') || initialImage.startsWith('https://')) {
        try {
          const url = new URL(initialImage);
          normalized = url.pathname; // Get just the /app_data/images/... part
        } catch (e) {
          console.error('Invalid URL:', initialImage);
          normalized = initialImage; // Fallback to original
        }
      } else {
        // If it's already a relative path, ensure it starts with /
        normalized = initialImage.startsWith('/') ? initialImage : `/${initialImage}`;
      }
    }
    setPreviewImages(normalized);
  }, [initialImage]);

  useEffect(() => {
    if (isOpen && !previousGeneratedImages.length) {
      getPreviousGeneratedImage();
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {

    setIsOpen(false);
    // Delay the actual close to allow animation to complete
    setTimeout(() => {
      onClose?.();
    }, 300); // Match the Sheet animation duration
  };

  const getPreviousGeneratedImage = async () => {
    try {
      trackEvent(MixpanelEvent.ImageEditor_GetPreviousGeneratedImages_API_Call);
      const response =
        await PresentationGenerationApi.getPreviousGeneratedImages();
      // Ensure all image paths start with / for proper URL resolution
      const normalizedImages = response.map(img => ({
        ...img,
        path: img.path.startsWith('/') ? img.path : `/${img.path}`
      }));
      setPreviousGeneratedImages(normalizedImages);
    } catch (error: any) {
      toast.error("Failed to get previous generated images. Please try again.");
      console.error("error in getting previous generated images", error);
      setError(
        error.message ||
          "Failed to get previous generated images. Please try again."
      );
    }
  };

  /**
   * Handles image selection and calls the parent callback
   */
  const handleImageChange = (newImage: string) => {
    if (onImageChange) {
      onImageChange(newImage, promptContent);
      setPreviewImages(newImage);
    }
  };

  /**
   * Handles focus point adjustment when clicking on the image
   */
  const handleFocusPointClick = (e: React.MouseEvent) => {
    if (!isFocusPointMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
    );

    setFocusPoint({ x, y });
    saveImageProperties(objectFit, { x, y });

    // Apply the focus point in real-time
    if (imageRef.current) {
      imageRef.current.style.objectPosition = `${x}% ${y}%`;
    }
  };

  /**
   * Toggles focus point adjustment mode
   */
  const toggleFocusPointMode = () => {
    if (isFocusPointMode) {
      saveImageProperties(objectFit, focusPoint);
    }
    setIsFocusPointMode(!isFocusPointMode);
  };

  /**
   * Handles object fit change
   */
  const handleFitChange = (fit: "cover" | "contain" | "fill") => {
    setObjectFit(fit);

    if (imageRef.current) {
      imageRef.current.style.objectFit = fit;
    }

    saveImageProperties(fit, focusPoint);
  };

  /**
   * Saves image properties (focus point and object fit)
   */
  const saveImageProperties = (
    fit: "cover" | "contain" | "fill",
    focusPoint: { x: number; y: number }
  ) => {
    const propertiesData = {
      initialObjectFit: fit,
      initialFocusPoint: focusPoint,
    };
    // TODO: Save to Redux store if needed
    onFocusPointClick?.(propertiesData);
  };

  /**
   * Generates new images using AI
   */
  const handleGenerateImage = async () => {
    if (!prompt) {
      setError("Please enter a prompt");
      return;
    }
    try {
      setIsGenerating(true);
      setError(null);
      trackEvent(MixpanelEvent.ImageEditor_GenerateImage_API_Call);
      const response = await PresentationGenerationApi.generateImage({
        prompt: prompt,
      });

      setPreviewImages(response);
    } catch (err: any) {
      console.error("Error in image generation", err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handles file upload
   */
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }
    try {
      setIsUploading(true);
      setUploadError(null);
      trackEvent(MixpanelEvent.ImageEditor_UploadImage_API_Call);
      const result = await ImagesApi.uploadImage(file);
      // Normalize path - handle both full URLs and relative paths
      let imagePath = result.path;
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        try {
          const url = new URL(imagePath);
          imagePath = url.pathname;
        } catch (e) {
          console.error('Invalid URL:', imagePath);
        }
      }
      if (!imagePath.startsWith('/')) {
        imagePath = `/${imagePath}`;
      }
      setUploadedImageUrl(imagePath);
    } catch (err:any) {
      setUploadError("Failed to upload image. Please try again.");
      toast.error(err.message || "Failed to upload image. Please try again.");
      console.log("Upload error:", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const getUploadedImages = async () => {
    try {
      setUploadedImagesLoading(true);
      const result = await ImagesApi.getUploadedImages();
      console.log('Fetched uploaded images:', result);
      // Normalize image paths - handle both full URLs and relative paths
      const normalizedImages = result.map(img => {
        let path = img.path;
        // If it's a full URL, extract just the path part
        if (path.startsWith('http://') || path.startsWith('https://')) {
          try {
            const url = new URL(path);
            path = url.pathname; // Get just the /app_data/images/... part
          } catch (e) {
            console.error('Invalid URL:', path);
          }
        }
        // Ensure path starts with /
        if (!path.startsWith('/')) {
          path = `/${path}`;
        }
        return { ...img, path };
      });
      console.log('Normalized uploaded images:', normalizedImages);
      setUploadedImages(normalizedImages);
    } catch (err:any) {
      toast.error(err.message || "Failed to get uploaded images. Please try again.");
      console.log("Get uploaded images error:", err.message);
    } finally {
      setUploadedImagesLoading(false);
    }
  };
  const handleTabChange = (value: string) => {
    if (value === "upload") {
      getUploadedImages();
    }
  };

  const handleDeleteImage = async (image_id: string) => {
    try {
      const result = await ImagesApi.deleteImage(image_id);
      setUploadedImages(uploadedImages.filter((image) => image.id !== image_id));
      toast.success(result.message || "Image deleted successfully");
    } catch (err:any) {
      toast.error(err.message || "Failed to delete image. Please try again.");
    }
  };
  return (
    <div className="image-editor-container">
      <Sheet open={isOpen} onOpenChange={() => handleClose()}>
        <SheetContent
          side="right"
          className="w-[600px]"
          style={{
            background: isDarkMode ? "#2a2a2a" : "#ffffff",
          }}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle className={isDarkMode ? "text-gray-200" : "text-gray-800"}>Update Image</SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <Tabs defaultValue="generate" className="w-full" onValueChange={handleTabChange}>
              <TabsList
                className={`grid border w-full grid-cols-3 mx-auto ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-blue-100 border-blue-300"
                }`}
              >
                <TabsTrigger
                  className={`font-medium ${
                    isDarkMode
                      ? "text-gray-200 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white data-[state=active]:text-primary"
                  }`}
                  value="generate"
                >
                  AI Generate
                </TabsTrigger>
                <TabsTrigger
                  className={`font-medium ${
                    isDarkMode
                      ? "text-gray-200 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white data-[state=active]:text-primary"
                  }`}
                  value="upload"
                >
                  Upload
                </TabsTrigger>
                <TabsTrigger
                  className={`font-medium ${
                    isDarkMode
                      ? "text-gray-200 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                      : "data-[state=active]:bg-white data-[state=active]:text-primary"
                  }`}
                  value="edit"
                >
                  Edit
                </TabsTrigger>
              </TabsList>
              {/* Generate Tab */}
              <TabsContent value="generate" className="mt-4 space-y-4 overflow-y-auto hide-scrollbar h-[85vh]">
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Current Prompt</h3>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{promptContent}</p>
                  </div>

                  <div>
                    <h3 className={`text-base font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                      Image Description
                    </h3>
                    <Textarea
                      placeholder="Describe the image you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className={`min-h-[100px] ${
                        isDarkMode
                          ? "bg-gray-700 text-gray-200 border-gray-600 placeholder:text-gray-400"
                          : "bg-white text-gray-900 border-gray-300 placeholder:text-gray-400"
                      }`}
                    />
                  </div>

                  <Button
                    onClick={handleGenerateImage}
                    className="w-full"
                    disabled={!prompt || isGenerating}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGenerating ? "Generating..." : "Generate Image"}
                  </Button>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    {isGenerating || !previewImages ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                          key={index}
                          className="aspect-[4/3] w-full rounded-lg"
                        />
                      ))
                    ) : (
                      <div
                        onClick={() => handleImageChange(previewImages)}
                        className={`aspect-[4/3] w-full overflow-hidden rounded-lg border cursor-pointer transition-colors ${
                          isDarkMode
                            ? "border-gray-600 hover:border-blue-500"
                            : "border-gray-200 hover:border-blue-500"
                        }`}
                      >
                        {previewImages && (
                          <img
                            src={previewImages}
                            alt={`Preview`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  {previousGeneratedImages.length > 0 && (
                    <div className="mt-4">
                      <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        Previous Generated Images
                      </h3>
                      <div className="grid grid-cols-2 gap-4  ">
                        {previousGeneratedImages.map((image) => (
                          <div
                            onClick={() => handleImageChange(image.path)}
                            key={image.id}
                            className={`aspect-[4/3] w-full overflow-hidden rounded-lg border cursor-pointer transition-colors ${
                              isDarkMode
                                ? "border-gray-600 hover:border-blue-500"
                                : "border-gray-200 hover:border-blue-500"
                            }`}
                          >
                            <img
                              src={image.path}
                              alt={image.extras.prompt}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Upload Tab */}
              <TabsContent value="upload" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      isUploading
                        ? isDarkMode
                          ? "border-gray-600 bg-gray-800"
                          : "border-gray-400 bg-gray-50"
                        : isDarkMode
                        ? "border-gray-600 hover:border-blue-500"
                        : "border-gray-300 hover:border-blue-400"
                    )}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className={cn(
                        "flex flex-col items-center",
                        isUploading ? "cursor-wait" : "cursor-pointer"
                      )}
                    >
                      {isUploading ? (
                        <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-2 ${
                          isDarkMode ? "border-gray-400" : "border-gray-400"
                        }`} />
                      ) : (
                        <Upload className={`w-8 h-8 mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                      )}
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {isUploading
                          ? "Uploading your image..."
                          : "Click to upload an image"}
                      </span>
                      <span className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Maximum file size: 5MB
                      </span>
                    </label>
                  </div>

                  {uploadError && (
                    <p className="text-red-500 text-sm text-center">
                      {uploadError}
                    </p>
                  )}

                  {(uploadedImageUrl || isUploading) && (
                    <div className="mt-4">
                      <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        Uploaded Image Preview
                      </h3>
                      <div className={`aspect-[4/3] relative rounded-lg overflow-hidden border ${
                        isDarkMode ? "border-gray-600" : "border-gray-200"
                      }`}>
                        {isUploading ? (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mb-2" />
                              <span className="text-sm text-gray-500">
                                Processing...
                              </span>
                            </div>
                          </div>
                        ) : (
                          uploadedImageUrl && (
                            <div
                              onClick={() =>
                                handleImageChange(uploadedImageUrl)
                              }
                              className="cursor-pointer group w-full h-full"
                            >
                              <img
                                src={uploadedImageUrl}
                                alt="Uploaded preview"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-white/90 px-3 py-1 rounded-full text-sm font-medium">
                                  Click to use this image
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Uploaded Images:</h3>
                    {uploadedImagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? "text-gray-400" : "text-gray-400"}`} />
                      </div>
                    ) : uploadedImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {uploadedImages.map((image) => (
                          <div key={image.id}>
                            <div
                              onClick={() =>
                                handleImageChange(image.path)
                              }
                              className={`cursor-pointer group aspect-[4/3] rounded-lg overflow-hidden relative border ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-800"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <Trash className="absolute group-hover:opacity-100 opacity-0 transition-opacity z-10 w-4 h-4 top-2 right-2 text-red-500" onClick={(e) =>{
                                e.stopPropagation();
                                handleDeleteImage(image.id)
                              }}/>
                              <img
                                src={image.path}
                                alt="Uploaded preview"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  console.error('Failed to load uploaded image. Path:', image.path);
                                  e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs p-2"><div class="text-center"><div class="font-semibold mb-1">Failed to load</div><div class="text-[10px] break-all">${image.path}</div></div></div>`;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-medium">
                                  Use
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center py-8 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No uploaded images yet
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="edit" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Preview</h3>
                  <div
                    onClick={(e) => {
                      if (isFocusPointMode) {
                        handleFocusPointClick(e);
                      }
                    }}
                    className={`aspect-[4/3] group rounded-lg overflow-hidden relative border ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-800"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    {previewImages ? (
                      <>
                        <img
                          ref={imageRef}
                          onClick={() => {
                            setIsFocusPointMode(true);
                          }}
                          src={previewImages}
                          style={{
                            objectFit: objectFit,
                            objectPosition: `${focusPoint.x}% ${focusPoint.y}%`,
                          }}
                          alt="Preview"
                          className="w-full h-full cursor-pointer"
                        />
                        {!isFocusPointMode && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 pointer-events-none">
                            <p className="group-hover:opacity-100 opacity-0 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-center font-medium bg-black/70 text-white px-3 py-2 rounded pointer-events-none">
                              Click to Change Focus Point
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>
                        No image selected
                      </div>
                    )}
                    {isFocusPointMode && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                        <div className="text-white text-center p-2 bg-black/50 rounded">
                          <p className="text-sm font-medium pointer-events-none">
                            Click anywhere to set focus point
                          </p>
                          <button
                            className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFocusPointMode();
                            }}
                          >
                            Done
                          </button>
                        </div>

                        <div
                          className="absolute w-8 h-8 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                          style={{
                            left: `${focusPoint.x}%`,
                            top: `${focusPoint.y}%`,
                            boxShadow: "0 0 0 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <div className="absolute w-16 h-0.5 bg-white/70 left-1/2 -translate-x-1/2"></div>
                          <div className="absolute w-0.5 h-16 bg-white/70 top-1/2 -translate-y-1/2"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Edit Image  */}
                  {/* Object Fit */}
                  {
                    <div>
                      <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>Object Fit</h3>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className={cn(
                            isDarkMode
                              ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50",
                            objectFit === "cover" &&
                              (isDarkMode
                                ? "bg-blue-900 border-blue-500 text-blue-200 hover:bg-blue-900"
                                : "bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-50")
                          )}
                          onClick={() => handleFitChange("cover")}
                        >
                          Cover
                        </Button>
                        <Button
                          variant="outline"
                          className={cn(
                            isDarkMode
                              ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50",
                            objectFit === "contain" &&
                              (isDarkMode
                                ? "bg-blue-900 border-blue-500 text-blue-200 hover:bg-blue-900"
                                : "bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-50")
                          )}
                          onClick={() => handleFitChange("contain")}
                        >
                          Contain
                        </Button>
                        <Button
                          variant="outline"
                          className={cn(
                            isDarkMode
                              ? "border-gray-600 text-gray-200 hover:bg-gray-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50",
                            objectFit === "fill" &&
                              (isDarkMode
                                ? "bg-blue-900 border-blue-500 text-blue-200 hover:bg-blue-900"
                                : "bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-50")
                          )}
                          onClick={() => handleFitChange("fill")}
                        >
                          Fill
                        </Button>
                      </div>
                    </div>
                  }
                  {/* Focus Point */}
                  {}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default React.memo(ImageEditor);
