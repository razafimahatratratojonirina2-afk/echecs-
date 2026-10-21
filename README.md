# Échecs 3D

Jeu d’échecs 3D (Three.js r128 via cdnjs), HTML + CSS + JavaScript, sans build. Caméra fixe, adaptée au mobile.

## Fonctionnalités
- Mode « Contre l’ordinateur » avec 5 niveaux : Débutant, Amateur, Normal, Avancé, Maître
- Mode « 2 joueurs » (sur le même appareil)
- Choix de la couleur (Blancs/Noirs), bouton « Pivoter » pour changer le côté de vue
- Règles complètes : roque, prise en passant, promotion (dame), échec et mat, pat
- Vitesse des déplacements réglable (Lent par défaut, Normal, Rapide)
- Annuler, nouvelle partie, liste des coups

## Niveaux (dans `script.js`, tableau `LV`)
d = profondeur max, noise = imprécision, rnd = coups aléatoires, ms = temps max de réflexion, q = recherche des captures

## Déployer
Site statique : déposez le dossier tel quel sur Netlify, Vercel, GitHub Pages, Cloudflare Pages, etc.
Pour ne pas dépendre du CDN, téléchargez three.min.js (r128) dans le dossier et remplacez l’URL de la balise <script> dans `index.html` par `three.min.js`.
"# echecs-" 
