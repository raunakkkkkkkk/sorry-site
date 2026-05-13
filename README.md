# Romantic Apology Website

A soft, animated apology website built with HTML, Tailwind CSS, vanilla JavaScript, GSAP, and Firebase Firestore.

## Firebase Setup

1. Go to the Firebase Console and create a project.
2. Add a web app inside the project settings.
3. Enable Firestore Database.
4. Open `firebase.js` and replace every `YOUR_...` value in `firebaseConfig`.
5. The site writes responses to the `apologyResponses` collection with:
   - `option`
   - `customMessage`
   - `createdAt`

For quick testing, you can start with these Firestore rules, then tighten them before sharing publicly:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /apologyResponses/{docId} {
      allow create: if true;
      allow read: if true;
      allow delete: if true;
    }
  }
}
```

The admin password is in `admin.html` as `ADMIN_PASSWORD`. Change it before deploying. This is a simple front-end password, so do not use it for private or sensitive data.

## Deployment

### Vercel

1. Push these files to a GitHub repository.
2. Import the repo in Vercel.
3. Keep the default static site settings.
4. Visit `/admin` or `/admin.html` for the admin page.

### GitHub Pages

1. Push the files to a GitHub repository.
2. Go to Settings > Pages.
3. Choose your branch and root folder.
4. Open the published URL.
5. Visit `/admin` or `/admin.html` for the admin page.

## Change Texts And Colors

- Main romantic texts live in `index.html`.
- Quote rotation text lives in the `quotes` array in `script.js`.
- Popup messages live in the `cuteMessages` array in `script.js`.
- Colors live at the top of `style.css` in the `:root` variables.
- Punishment options are the `.option-card` buttons in `index.html`.

## Background Music

The music toggle uses browser Web Audio to create a tiny soft pad, so no audio file is required. To use a real lofi instrumental, replace the Web Audio logic in `script.js` with an `<audio>` element and a licensed MP3 file.
