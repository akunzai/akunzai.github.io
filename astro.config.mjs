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
          title: { en: 'Blog', 'zh-TW': '部落格' },
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
          translations: { 'zh-TW': '筆記' },
          items: [{ label: 'Overview', link: '/notes/', translations: { 'zh-TW': '總覽' } }],
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
