declare module 'virtual:starlight/user-config' {
	import type { StarlightIcon } from '@astrojs/starlight/types'

	const config: {
		social?: Array<{ href: string; icon: StarlightIcon; label: string }>
	}
	export default config
}

interface ImportMetaEnv {
	readonly PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?: string
	readonly PUBLIC_SENTRY_DSN?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
