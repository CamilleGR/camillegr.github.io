import { defineConfig } from 'astro/config';

import starlight from '@astrojs/starlight';


export default defineConfig({
	site: 'https://camillegr.github.io',
	integrations: [
		starlight({
			title: 'Camille Gr.',
			description:
				'Writeups CTF, mini-projets et notes techniques — sécurité offensive, automatisation et performance SI.',
			defaultLocale: 'fr',
			customCss: ['./src/styles/custom.css'],
			locales: {
				root: { label: 'Français', lang: 'fr' },
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/CamilleGR' },
				{ icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/camille-gerin-roze-377268a9/' }

			],
				favicon:"favicon.svg"
			,
			sidebar: [
				{
					label: 'Blogs',
					collapsed: false,
					items: [{ autogenerate: { directory: 'blogs', collapsed: true } }],
				},
				{
					label: 'Writeups',
					collapsed: true,
					items: [{ autogenerate: { directory: 'writeups', collapsed: true } }],
				},
				
				{
					label: 'Outils',
					collapsed: true,
					items: [{ autogenerate: { directory: 'outils', collapsed: true } }],
				},
				{
					label: 'CTF',
					collapsed: true,
					items: [{ autogenerate: { directory: 'ctf', collapsed: true } }],
				}

			],
		})
	]})
