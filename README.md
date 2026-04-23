# 🔊 Local Meme Soundboard

A lightweight, local-first web app that allows you to play meme sounds via clickable buttons.

## 🚀 Deployment to Vercel

To take this app live on Vercel, follow these steps:

### Option 1: Using Vercel CLI (Quickest)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Run the deployment command in the project root:
   ```bash
   vercel
   ```
3. Follow the prompts to link the project and deploy.

### Option 2: Using GitHub Integration (Recommended)

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New"** > **"Project"**.
4. Import your GitHub repository.
5. Vercel will automatically detect the static files and deploy them.

## 🛠️ Features

- **IndexedDB Persistence**: Your imported sounds are stored locally in your browser and persist across sessions.
- **Offline Ready**: Once loaded, the app works entirely without an internet connection.
- **Customizable**: Add, rename, and delete sounds easily in Edit Mode.
- **Volume Control**: Global volume management with overlap support.

## 📁 File Structure

- `index.html`: App layout and structure.
- `styles.css`: Dark-themed responsive design.
- `app.js`: Core logic for audio handling and storage.
- `assets/sounds/`: Directory for your local pre-loaded sounds.
- `vercel.json`: Deployment configuration.

## 📦 Adding Your Own Pre-loaded Sounds

If you want the app to already have certain sounds loaded every time someone opens the live link for the first time:

1. Drag your audio files into the `assets/sounds/` folder.
2. Open `app.js`.
3. Locate the `DEFAULT_SOUNDS` array at the top.
4. Add your file details like this:
   ```javascript
   { name: 'My Sound Name', url: 'assets/sounds/your-file-name.mp3' },
   ```
5. Deploy to Vercel.

When a user visits the site, the app will fetch these files from your server (Vercel), convert them to local database entries, and they will be permanently available on their device!
