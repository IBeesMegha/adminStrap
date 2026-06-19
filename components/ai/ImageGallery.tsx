/**
 * ImageGallery Component
 * Displays retrieved images from RAG search alongside AI-generated answers
 */

import React, { useState } from 'react';
import Image from 'next/image';

export interface ImageData {
  url: string;
  alt?: string;
  caption?: string;
  title?: string;
  width?: number;
  height?: number;
  type: 'image' | 'pdf' | 'video';
  mimeType?: string;
  source?: string;
  pageUrl?: string;
  relevanceScore?: number;
}

interface ImageGalleryProps {
  images?: ImageData[];
  maxImages?: number;
  onImageClick?: (image: ImageData) => void;
  className?: string;
}

interface ExpandedImage {
  image: ImageData;
  index: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  maxImages = 6,
  onImageClick,
  className = '',
}) => {
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  if (!images || images.length === 0) {
    return null;
  }

  const displayImages = images.slice(0, maxImages);

  const handleImageClick = (image: ImageData) => {
    setExpandedImage({ image, index: displayImages.indexOf(image) });
    onImageClick?.(image);
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (!expandedImage) return;

    let newIndex = expandedImage.index;
    if (direction === 'next') {
      newIndex = (newIndex + 1) % displayImages.length;
    } else {
      newIndex = (newIndex - 1 + displayImages.length) % displayImages.length;
    }

    setExpandedImage({
      image: displayImages[newIndex],
      index: newIndex,
    });
  };

  return (
    <>
      {/* Image Gallery Grid */}
      <div
        className={`mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${className}`}
      >
        {displayImages.map((image, index) => {
          const hasError = imageErrors.has(image.url);

          return (
            <div
              key={`${image.url}-${index}`}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition-shadow hover:shadow-md"
              onClick={() => handleImageClick(image)}
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full cursor-pointer overflow-hidden bg-gray-100">
                {!hasError ? (
                  <Image
                    src={image.url}
                    alt={image.alt || image.title || 'Retrieved image'}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(image.url)}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <div className="text-center text-xs text-gray-500">
                      <div className="mb-1">📷</div>
                      <div>Image unavailable</div>
                    </div>
                  </div>
                )}

                {/* Overlay with Title on Hover */}
                {(image.title || image.caption) && (
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="w-full p-2 text-white">
                      {image.title && (
                        <p className="truncate text-xs font-semibold">{image.title}</p>
                      )}
                      {image.caption && (
                        <p className="line-clamp-2 text-xs text-gray-100">{image.caption}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Badge for Image Type */}
                {image.type !== 'image' && (
                  <div className="absolute right-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                    {image.type.toUpperCase()}
                  </div>
                )}

                {/* Relevance Score Badge */}
                {image.relevanceScore !== undefined && (
                  <div className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-1 text-xs font-medium text-white opacity-80">
                    {(image.relevanceScore * 100).toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Alt Text Below Image */}
              {image.alt && (
                <div className="border-t border-gray-200 p-2">
                  <p className="line-clamp-2 text-xs text-gray-600">{image.alt}</p>
                </div>
              )}

              {/* Read More link */}
              {image.pageUrl && (
                <div className="border-t border-gray-200 px-2 pb-2 pt-1">
                  <a
                    href={image.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    Read More
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more indicator */}
      {images.length > maxImages && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            +{images.length - maxImages} more image{images.length - maxImages > 1 ? 's' : ''} available
          </p>
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage && (
        <ImageModal
          image={expandedImage.image}
          index={expandedImage.index}
          total={displayImages.length}
          onClose={() => setExpandedImage(null)}
          onNext={() => navigateImage('next')}
          onPrev={() => navigateImage('prev')}
          onImageError={handleImageError}
        />
      )}
    </>
  );
};

interface ImageModalProps {
  image: ImageData;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onImageError: (url: string) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  image,
  index,
  total,
  onClose,
  onNext,
  onPrev,
  onImageError,
}) => {
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    setHasError(true);
    onImageError(image.url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-4xl w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -right-10 -top-10 rounded-full bg-white p-2 text-gray-800 shadow-lg transition-colors hover:bg-gray-100"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image Container */}
        <div className="relative flex flex-col">
          <div className="relative aspect-auto w-full bg-gray-900">
            {!hasError ? (
              <Image
                src={image.url}
                alt={image.alt || image.title || 'Expanded image'}
                width={image.width || 1200}
                height={image.height || 800}
                className="max-h-[70vh] w-auto"
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-96 w-full items-center justify-center bg-gray-800 text-center">
                <div className="text-white">
                  <div className="mb-2 text-4xl">📷</div>
                  <p>Image could not be loaded</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Information */}
          <div className="space-y-3 bg-gray-900 p-4 text-white">
            {image.title && (
              <div>
                <h3 className="font-semibold">{image.title}</h3>
              </div>
            )}

            {image.caption && (
              <div>
                <p className="text-sm text-gray-300">{image.caption}</p>
              </div>
            )}

            {image.alt && (
              <div>
                <p className="text-xs text-gray-400">Alt: {image.alt}</p>
              </div>
            )}

            {image.mimeType && (
              <div className="text-xs text-gray-500">
                Type: {image.type.charAt(0).toUpperCase() + image.type.slice(1)} ({image.mimeType})
              </div>
            )}

            {image.width && image.height && (
              <div className="text-xs text-gray-500">
                Dimensions: {image.width}x{image.height}px
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                {index + 1} / {total}
              </div>

              <div className="flex gap-2">
                {total > 1 && (
                  <>
                    <button
                      onClick={onPrev}
                      className="rounded-lg bg-gray-700 px-4 py-2 text-sm transition-colors hover:bg-gray-600"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={onNext}
                      className="rounded-lg bg-gray-700 px-4 py-2 text-sm transition-colors hover:bg-gray-600"
                    >
                      Next →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
