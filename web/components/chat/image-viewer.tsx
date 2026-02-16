"use client";

import { useState } from "react";
import { X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
    src: string;
    alt?: string;
    className?: string;
}

export function ImageViewer({ src, alt = "Image", className }: ImageViewerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <>
            <div className={cn("relative group", className)}>
                <div className="mt-2 w-full aspect-video rounded-xl overflow-hidden border border-border/50 shadow-sm relative">
                    <img 
                        src={src} 
                        alt={alt} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer" 
                        onClick={() => setIsFullscreen(true)}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFullscreen(true);
                        }}
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setIsFullscreen(false)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-10 w-10 text-white hover:bg-white/10"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    <img 
                        src={src} 
                        alt={alt}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

