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
					label: 'Writeups',
					items: [{ autogenerate: { directory: 'writeups' } }],
				},
				{
					label: 'Blogs',
					items: [{ autogenerate: { directory: 'blogs' } }],
				},
				{
					label: 'Outils',
					items: [{ autogenerate: { directory: 'outils' } }],
				},
				{
					label: 'CTF',
					items: [{ autogenerate: { directory: 'ctf' } }],
				}

			],
		})
	]})
