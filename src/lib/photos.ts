import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import registry from '../data/photos.json';

const originals = import.meta.glob<ImageMetadata>('/src/assets/photos/*.jpg', { eager: true, import: 'default' });

export interface Photo {
  id: string;
  src: string;
  srcSet: string;
  fallbackSrc: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  author: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  share: { src: string; width: number; height: number };
}

// Only reviewed local originals can be rendered. Builds never fetch remote images.
export async function getPhoto(id: string): Promise<Photo> {
  const record = registry.find(photo => photo.id === id);
  if (!record) throw new Error(`Unregistered photo: ${id}`);
  const original = originals[`/src/assets/photos/${record.file}`];
  if (!original) throw new Error(`Missing photo original: ${record.file}`);
  const width = Math.min(1200, original.width);
  const [responsive, fallback, share] = await Promise.all([
    getImage({ src: original, width, widths: [400, 680, 800, 1200, 1600].filter(value => value <= original.width), format: 'webp', quality: 78 }),
    getImage({ src: original, width, format: 'jpeg', quality: 80 }),
    getImage({ src: original, width: 1200, height: 630, fit: 'cover', position: 'center', format: 'jpeg', quality: 82 })
  ]);
  return {
    id: record.id, src: responsive.src, srcSet: responsive.srcSet.attribute,
    fallbackSrc: fallback.src, width, height: Math.round(original.height * width / original.width),
    alt: record.alt, caption: record.caption, author: record.author,
    sourceUrl: record.sourceUrl, license: record.license, licenseUrl: record.licenseUrl,
    share: { src: share.src, width: 1200, height: 630 }
  };
}

export async function getArticlePhoto(hero?: { photoId?: string; src?: string; alt?: string; credit?: string; license?: string }): Promise<Photo | null> {
  return hero?.photoId ? getPhoto(hero.photoId) : null;
}

export const photoRecords = registry;
