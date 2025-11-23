import fs from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/app/mdx-components';

export type PostFrontmatter = {
  title: string;
  summary?: string;
  date?: string;
  tags?: string[];
};

export type Post = {
  slug: string;
  frontmatter: PostFrontmatter;
};

const CONTENT_PATH = path.join(process.cwd(), 'content');

export async function getPostSlugs(): Promise<string[]> {
  const entries = await fs.readdir(CONTENT_PATH);
  return entries
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));
}

export async function getPostBySlug(slug: string) {
  const filePath = path.join(CONTENT_PATH, `${slug}.mdx`);
  const source = await fs.readFile(filePath, 'utf8');

  const { content, frontmatter } = await compileMDX<PostFrontmatter>({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
      },
    },
  });

  return { slug, content, frontmatter } as const;
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = await getPostSlugs();
  const posts: Post[] = [];

  for (const slug of slugs) {
    const filePath = path.join(CONTENT_PATH, `${slug}.mdx`);
    const source = await fs.readFile(filePath, 'utf8');
    const { data } = matter(source);
    posts.push({
      slug,
      frontmatter: data as PostFrontmatter,
    });
  }

  return posts.sort((a, b) => (a.frontmatter.date || '').localeCompare(b.frontmatter.date || '')).reverse();
}
