declare module 'virtual:starlight/user-config' {
	import type { StarlightIcon } from '@astrojs/starlight/types'

	const config: {
		social?: Array<{ href: string; icon: StarlightIcon; label: string }>
	}
	export default config
}
