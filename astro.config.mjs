import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightBlog from 'starlight-blog'

export default defineConfig({
  site: 'https://akunzai.github.io',
  integrations: [
    starlight({
      title: "Charley's site",
      defaultLocale: 'zh-tw',
      locales: {
        'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
      },
      plugins: [
        starlightBlog({
          title: 'Blog',
          authors: {
            charley: {
              name: 'Charley Wu',
              url: 'https://github.com/akunzai',
            },
          },
        }),
      ],
      sidebar: [
        {
          label: 'Notes',
          items: [{ label: 'Overview', link: '/notes/' }],
        },
      ],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/akunzai',
        },
      ],
    }),
  ],
})
