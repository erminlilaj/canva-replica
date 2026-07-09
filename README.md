# Postera

Postera is a frontend-only, browser-based poster editor built for a single non-technical user (an Albanian-language school poster builder). No accounts, no backend — posters live in the browser's IndexedDB and export as print-ready PDFs client-side. See [AGENTS.md](AGENTS.md) for the full design spec and [PRODUCTION.md](PRODUCTION.md) for production-readiness status.

Postera është një editor lokal për postera shkollorë dhe institucionalë. Qëllimi i parë është ta bëjë të lehtë ndërtimin e posterave si “Vlerësimi i Riskut”, pa llogari, backend apo mjete të ndërlikuara dizajni.

## Si ta nisësh

```powershell
npm.cmd install
npm.cmd run dev
```

Pastaj hap adresën që jep Vite në terminal.

## Parimet kryesore

- UI në shqip, me tekstet në `src/i18n/sq.ts`.
- Posterët ndërtohen nga blloqe të strukturuara, jo nga canvas i lirë.
- Gjeometria ruhet në milimetra për printim dhe eksport më të saktë.
- Ruajtja bëhet në IndexedDB dhe me skedar `.json`.
- Eksporti kryesor është print-to-PDF nga shfletuesi.

## Si ta publikosh (Vercel)

Aplikacioni është një build statik Vite, pa nevojë për konfigurim shtesë:

1. Shko te [vercel.com/new](https://vercel.com/new) dhe importo këtë depo (repository) nga GitHub.
2. Vercel e njeh vetë Vite: `Build Command` = `npm run build`, `Output Directory` = `dist`. Mos ndrysho asgjë.
3. Shto "Deploy". Çdo push në `main` do të rijetësojë (redeploy) automatikisht.

Nuk nevojitet asnjë ndryshim në `vite.config.ts` për Vercel (nuk ka nën-shteg si te GitHub Pages).
