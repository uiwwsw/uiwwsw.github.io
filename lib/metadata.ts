import type { Metadata } from 'next';

const siteUrl = 'https://uiwwsw.github.io';
const siteName = 'Next.js Starter';
const siteDescription =
  'TypeScript + Tailwind CSS + MDX base on Next.js App Router with sensible defaults.';

const defaultTitle: Metadata['title'] = {
  default: siteName,
  template: `%s | ${siteName}`,
};

export function buildMetadata(meta?: Partial<Metadata>): Metadata {
  const title = meta?.title ?? defaultTitle;
  const description = meta?.description ?? siteDescription;
  const openGraphImage = meta?.openGraph?.images;
  const resolvedTitle =
    typeof title === 'string' ? title : (title && 'default' in title ? title.default : siteName);

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    applicationName: siteName,
    keywords: ['Next.js', 'TypeScript', 'RSC', 'Performance', 'SEO', 'MDX'],
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      url: siteUrl,
      siteName,
      locale: 'ko_KR',
      type: 'website',
      title: resolvedTitle,
      description,
      ...(openGraphImage ? { images: openGraphImage } : {}),
      ...meta?.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      creator: '@nextjs',
      ...(openGraphImage ? { images: openGraphImage } : {}),
      ...meta?.twitter,
    },
    icons: {
      icon: '/favicon.ico',
    },
    ...meta,
  } satisfies Metadata;
}

export const siteMetadata = {
  siteName,
  siteDescription,
  siteUrl,
};
