import { defineConfig } from 'astro/config';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeFigure from 'rehype-figure';

export default defineConfig({
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      rehypeFigure,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
      [rehypeExternalLinks, { target: '_blank', rel: 'noopener noreferrer' }],
    ],
  },
});
