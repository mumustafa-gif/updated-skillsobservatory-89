# Skills Observatory

A comprehensive policy analysis platform with strategic recommendations for workforce development, featuring AI-powered insights, interactive charts, and detailed reporting capabilities.

## Project info

**URL**: https://lovable.dev/projects/6b555f5d-88dd-4c32-b7ba-bd827b9b481d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6b555f5d-88dd-4c32-b7ba-bd827b9b481d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- **Frontend**: Vite, TypeScript, React
- **UI Components**: shadcn-ui, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **Charts**: Chart.js, Recharts
- **AI Integration**: OpenAI GPT models
- **File Processing**: PDF generation, CSV/Excel parsing
- **Maps**: Mapbox integration

## How can I deploy this project?

### Option 1: Deploy with Lovable (Recommended for quick deployment)

Simply open [Lovable](https://lovable.dev/projects/6b555f5d-88dd-4c32-b7ba-bd827b9b481d) and click on Share -> Publish.

### Option 2: Deploy to your own Nginx server

#### Prerequisites
- Nginx server with root access
- Node.js and npm installed locally
- SSH access to your production server

#### Build the application
```bash
npm run build
```

#### Upload files to server
```bash
# Using rsync (recommended)
rsync -avz --delete dist/ user@your-server-ip:/var/www/html/skills-observatory/

# Or using SCP
scp -r dist/* user@your-server-ip:/var/www/html/skills-observatory/
```

#### Nginx Configuration
Create `/etc/nginx/sites-available/skills-observatory`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/html/skills-observatory;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Handle React Router (SPA routing)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### Server setup commands
```bash
# Create web directory
sudo mkdir -p /var/www/html/skills-observatory

# Set permissions
sudo chown -R www-data:www-data /var/www/html/skills-observatory
sudo chmod -R 755 /var/www/html/skills-observatory

# Enable site
sudo ln -s /etc/nginx/sites-available/skills-observatory /etc/nginx/sites-enabled/

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### Automated deployment script
Create `deploy.sh`:
```bash
#!/bin/bash
SERVER_USER="your-username"
SERVER_IP="your-server-ip"
SERVER_PATH="/var/www/html/skills-observatory"

echo "🚀 Building project..."
npm run build

echo "📤 Uploading files..."
rsync -avz --delete dist/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "🔧 Setting permissions..."
ssh $SERVER_USER@$SERVER_IP "sudo chown -R www-data:www-data $SERVER_PATH && sudo chmod -R 755 $SERVER_PATH"

echo "🔄 Reloading Nginx..."
ssh $SERVER_USER@$SERVER_IP "sudo nginx -t && sudo systemctl reload nginx"

echo "✅ Deployment complete!"
```

Make executable: `chmod +x deploy.sh`

#### Environment Variables
Ensure your production environment has the correct Supabase configuration:
- Update Supabase project settings to allow your production domain
- Configure any necessary environment variables for production

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
