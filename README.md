# Postera

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
