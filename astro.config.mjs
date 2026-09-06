import { defineConfig } from 'astro/config'
import mermaid from 'astro-mermaid'
import starlight from '@astrojs/starlight'
import starlightBlog from 'starlight-blog'

export default defineConfig({
  site: 'https://akunzai.github.io',
  integrations: [
    mermaid({
      autoTheme: true,
    }),
    starlight({
      title: {
        'zh-TW': '應無所住，而生其心',
        en: 'Abiding nowhere, give rise to mind.',
      },
      description: '查理的技術筆記與隨想',
      defaultLocale: 'zh-tw',
      locales: {
        'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
        en: { label: 'English', lang: 'en' },
      },
      plugins: [
        starlightBlog({
          title: { en: 'Blog', 'zh-TW': '隨想' },
          navigation: 'header-start',
        }),
        {
          name: 'fix-blog-rss-head-link',
          hooks: {
            'config:setup'({ config, updateConfig, astroConfig }) {
              const site = astroConfig.site?.replace(/\/$/, '') ?? ''
              const head = (config.head ?? []).filter(
                (entry) =>
                  !(entry.tag === 'link' && entry.attrs?.type === 'application/rss+xml'),
              )
              for (const locale of Object.keys(config.locales ?? {})) {
                head.push({
                  tag: 'link',
                  attrs: {
                    href: `${site}/${locale}/blog/rss.xml`,
                    rel: 'alternate',
                    title: 'Blog',
                    type: 'application/rss+xml',
                  },
                })
              }
              updateConfig({ head })
            },
          },
        },
      ],
      customCss: ['./src/styles/custom.css'],
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
        SocialIcons: './src/components/SocialIcons.astro',
      },
      sidebar: [
        {
          label: 'Modern Dev Environment & Engineering Literacy',
          translations: { 'zh-TW': '現代開發環境與工程素養' },
          items: [{ autogenerate: { directory: 'notes/dev-environment' } }],
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
