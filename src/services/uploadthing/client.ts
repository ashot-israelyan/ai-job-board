import { UTApi } from 'uploadthing/server';

import { env } from '@/data/env/server';

export const uploadthing = new UTApi({ token: env.UPLOADTHING_TOKEN });
