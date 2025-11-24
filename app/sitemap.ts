import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/mdx';
import { siteMetadata } from '@/lib/metadata';

const staticRoutes = ['/', '/about', '/blog', '/oss', '/projects'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const lastModified = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${siteMetadata.siteUrl}${path}`,
      lastModified,
    })),
    ...posts.map((post) => ({
      url: `${siteMetadata.siteUrl}/blog/${post.slug}`,
      lastModified: post.frontmatter.date ? new Date(post.frontmatter.date) : lastModified,
    })),
  ];
}
