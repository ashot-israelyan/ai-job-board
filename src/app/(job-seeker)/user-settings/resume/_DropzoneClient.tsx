'use client';

import { useRouter } from 'next/navigation';

import { UploadDropzoone } from '@/services/uploadthing/components/UploadThing';

export function DropzoneClient() {
  const router = useRouter();

  return (
    <UploadDropzoone endpoint="resumeUploader" onClientUploadComplete={() => router.refresh()} />
  );
}
