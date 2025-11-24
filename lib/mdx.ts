import fs from 'fs/promises';
import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import path from 'path';
import type { ReactNode } from 'react';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import type { Pluggable, PluggableList } from 'unified';
import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/app/mdx-components';

export type PostFrontmatter = {
  title: string;
  summary?: string;
  date?: string;
  tags?: string[];
  published?: boolean;
  cover?: string;
};

export type PostHeading = {
  depth: 2 | 3;
  title: string;
  slug: string;
};

export type PostListItem = {
  slug: string;
  frontmatter: PostFrontmatter;
  readingMinutes: number;
  wordCount: number;
};

export type CompiledPost = PostListItem & {
  content: ReactNode;
  headings: PostHeading[];
};

const CONTENT_PATH = path.join(process.cwd(), 'content', 'posts');

const mdxOptions: { remarkPlugins: PluggableList; rehypePlugins: PluggableList } = {
  remarkPlugins: [],
  rehypePlugins: [rehypeSlug as unknown as Pluggable],
};

export async function getPostSlugs({ includeDrafts = false }: { includeDrafts?: boolean } = {}): Promise<string[]> {
  const entries = await fs.readdir(CONTENT_PATH);
  const mdxFiles = entries.filter((file) => file.endsWith('.mdx'));
  const slugs: string[] = [];

  for (const file of mdxFiles) {
    const filePath = path.join(CONTENT_PATH, file);
    const source = await fs.readFile(filePath, 'utf8');
    const { data } = matter(source);

    if (!includeDrafts && data.published === false) continue;
    slugs.push(file.replace(/\.mdx$/, ''));
  }

  return slugs;
}

export async function getPostBySlug(slug: string): Promise<CompiledPost> {
  const filePath = path.join(CONTENT_PATH, `${slug}.mdx`);
  const source = await fs.readFile(filePath, 'utf8');
  const { content: rawContent, data } = matter(source);

  if (data.published === false) {
    throw new Error('Draft posts are not available.');
  }

  const headings = extractHeadings(rawContent);
  const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const { content, frontmatter } = await compileMDX<PostFrontmatter>({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions,
    },
  });

  return {
    slug,
    content,
    frontmatter,
    headings,
    wordCount,
    readingMinutes,
  } as const;
}

export async function getAllPosts(): Promise<PostListItem[]> {
  const slugs = await getPostSlugs();
  const posts: PostListItem[] = [];

  for (const slug of slugs) {
    const filePath = path.join(CONTENT_PATH, `${slug}.mdx`);
    const source = await fs.readFile(filePath, 'utf8');
    const { data, content: rawContent } = matter(source);
    const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

    posts.push({
      slug,
      frontmatter: data as PostFrontmatter,
      readingMinutes,
      wordCount,
    });
  }

  return posts
    .filter((post) => post.frontmatter.published !== false)
    .sort((a, b) => {
      const dateA = normalizeDate(a.frontmatter.date);
      const dateB = normalizeDate(b.frontmatter.date);

      if (dateA === dateB) return a.slug.localeCompare(b.slug);
      return dateB - dateA;
    });
}

function extractHeadings(content: string): PostHeading[] {
  const withoutCode = content.replace(/```[\s\S]*?```/g, '');
  const headingRegex = /^(#{2,3})\s+(.*)$/gm;
  const slugger = new GithubSlugger();
  const headings: PostHeading[] = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(withoutCode))) {
    const depth = match[1].length as 2 | 3;
    const title = match[2].trim();
    headings.push({ depth, title, slug: slugger.slug(title) });
  }

  return headings;
}

function normalizeDate(value?: string) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
