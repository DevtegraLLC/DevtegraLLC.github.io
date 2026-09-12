// Content collections. `patch-notes` holds one entry per FitCreature build
// that has been RELEASED on both stores. Entries are written by the app
// repo's scripts/publish_patch_note.sh --site (F50 §4.5 step 11), never by
// hand, and this repo is public: an entry landing here is the moment the
// copy becomes visible, so nothing lands before both store dates are known.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const patchNotes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/patch-notes' }),
  schema: z.object({
    title: z.string().min(1),
    // Marketing version, e.g. "1.0.0". The build number is what changes per release.
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    build: z.number().int().positive(),
    // The day each store made the build available to the public.
    iosReleasedAt: z.coerce.date(),
    androidReleasedAt: z.coerce.date(),
  }),
});

export const collections = { patchNotes };
