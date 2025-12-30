'use client'

import React, { useRef, useState } from 'react'
import { File, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileWithId extends File {
    id: string;
}

interface SupportingDocProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
}

const SupportingDoc = ({ files, onFilesChange }: SupportingDocProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Convert Files to FileWithId with proper type checking
    const filesWithIds: FileWithId[] = files.map(file => {
        const fileWithId = file as FileWithId
        fileWithId.id = `${file.name || 'unnamed'}-${file.lastModified || Date.now()}-${file.size || 0}`
        return fileWithId
    })

    const formatFileSize = (bytes: number): string => {
        if (!bytes || bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isDragging: boolean) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(isDragging)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const droppedFiles = Array.from(e.dataTransfer.files);
        const hasPdf = files.some(file => file.type === 'application/pdf');

        const validTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        const invalidFiles = droppedFiles.filter(file => !validTypes.includes(file.type));
        if (invalidFiles.length > 0) {
            toast.error('Invalid file type', {
                description: 'Please upload only PDF, TXT, PPTX, or DOCX files',
            });
            return;
        }

        if (hasPdf && droppedFiles.some(file => file.type === 'application/pdf')) {
            toast.error('Multiple PDF files are not allowed', {
                description: 'Please select only one PDF file',
            });
            return;
        }

        const validFiles = droppedFiles.filter(file => {
            return !(hasPdf && file.type === 'application/pdf');
        });

        if (validFiles.length > 0) {
            const updatedFiles = [...files, ...validFiles]
            onFilesChange(updatedFiles)

            toast.success('Files selected', {
                description: `${validFiles.length} file(s) have been added`,
            })
        }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        const hasPdf = files.some(file => file.type === 'application/pdf');

        const validFiles = selectedFiles.filter(file => {
            return !(hasPdf && file.type === 'application/pdf');
        });

        if (validFiles.length > 0) {
            const updatedFiles = [...files, ...validFiles]
            onFilesChange(updatedFiles)

            toast.success('Files selected', {
                description: `${validFiles.length} file(s) have been added`,
            })
        }
    }

    const removeFile = (fileId: string) => {
        const updatedFiles = files.filter(file => {
            const currentFileId = `${file.name || 'unnamed'}-${file.lastModified || Date.now()}-${file.size || 0}`
            return currentFileId !== fileId
        })
        onFilesChange(updatedFiles)
    }


    return (
        <div className="w-full">
            <h2 className="text-foreground font-instrument_sans pt-4 text-lg mb-4">Supporting Documents</h2>
            <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "w-full border-2 border-dashed border-border rounded-lg",
                    "transition-all duration-300 ease-in-out bg-card/30",
                    "min-h-[300px] flex flex-col mb-8",
                    isDragging && "border-primary bg-primary/5"
                )}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDrop={handleDrop}
            >
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <Upload className={cn(
                        "w-12 h-12 text-muted-foreground mb-4",
                        isDragging && "text-primary"
                    )} />

                    <p className="text-foreground text-center mb-2">
                        {isDragging
                            ? 'Drop your file here'
                            : 'Drag and drop your file here or click below button'
                        }
                    </p>
                    <p className="text-muted-foreground text-sm text-center mb-4">
                        Supports PDFs, Text files, PPTX, DOCX
                    </p>

                    <input
                        type="file"
                        accept=".pdf,.txt,.pptx,.docx"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                        ref={fileInputRef}
                        multiple
                        data-testid="file-upload-input"
                    />

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                        }}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-full
                            hover:bg-primary/90 transition-colors duration-200
                            font-medium text-sm"
                    >
                        Choose Files
                    </button>
                </div>

                {files.length > 0 && (
                    <div className="border-t border-border bg-card/50 rounded-b-lg">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-medium text-foreground">
                                    Selected Files ({files.length})
                                </h3>
                            </div>
                            <div data-testid="file-list" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {filesWithIds.map((file) => {

                                    return (
                                        (
                                            <div key={file.id}
                                                className="bg-muted/30 rounded-lg border border-border overflow-hidden
                                            hover:border-primary group relative"
                                            >
                                                <div className="p-4 bg-primary/10 group-hover:bg-primary/20
                                            transition-colors flex items-center justify-center relative"
                                                >

                                                    <File className="w-8 h-8 text-primary" />

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeFile(file.id)
                                                        }}
                                                        className="absolute top-1 right-2 p-1.5
                                                    bg-background/80 backdrop-blur-sm rounded-full
                                                    text-muted-foreground hover:text-destructive
                                                    shadow-sm hover:shadow-md
                                                    transition-all duration-200"
                                                        aria-label="Remove file"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="p-3 relative">
                                                    <p className="text-sm font-medium text-foreground truncate mb-1 pr-2">
                                                        {file.name || 'Unnamed File'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default SupportingDoc
