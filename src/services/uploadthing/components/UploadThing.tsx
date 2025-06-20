'use client';

import { ComponentProps } from 'react';

import { generateUploadDropzone } from '@uploadthing/react';
import { Json } from '@uploadthing/shared';
import { toast } from 'sonner';
import { UploadThingError } from 'uploadthing/server';

import { cn } from '@/lib/utils';

import type { CustomFileRouter } from '../router';

const UploadDropzoneComponent = generateUploadDropzone<CustomFileRouter>();

export function UploadDropzoone({
  className,
  onClientUploadComplete,
  onUploadError,
  ...props
}: ComponentProps<typeof UploadDropzoneComponent>) {
  return (
    <UploadDropzoneComponent
      {...props}
      className={cn(
        'border-dashed border-2 border-muted rounded-lg flex items-center justify-center',
        className
      )}
      onClientUploadComplete={(res) => {
        res.forEach(({ serverData }) => {
          toast.success(serverData?.message);
        });
        onClientUploadComplete?.(res);
      }}
      onUploadError={(error: UploadThingError<Json>) => {
        toast.error(error.message);
        onUploadError?.(error);
      }}
    />
  );
}
