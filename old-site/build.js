#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple build script to copy source files to public directory
function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${src} → ${dest}`);
}

function buildSite() {
    console.log('Building TGM Ventures site...\n');
    
    // Copy HTML files from src to public
    const srcFiles = [
        'src/index.html',
        'src/privacy-policy.html', 
        'src/terms-of-service.html',
        'src/contact.html'
    ];
    
    srcFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const filename = path.basename(file);
            copyFile(file, `public/${filename}`);
        }
    });
    
    // Copy dashboard HTML files
    const dashboardFiles = [
        'src/dashboard/login.html',
        'src/dashboard/dashboard.html'
    ];
    
    dashboardFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const filename = path.basename(file);
            copyFile(file, `public/dashboard/${filename}`);
        }
    });
    
    // Copy CSS files
    if (fs.existsSync('src/css')) {
        const cssFiles = fs.readdirSync('src/css');
        cssFiles.forEach(file => {
            if (file.endsWith('.css')) {
                copyFile(`src/css/${file}`, `public/css/${file}`);
            }
        });
    }
    
    // Copy dashboard CSS files
    if (fs.existsSync('src/dashboard/css')) {
        const dashboardCssFiles = fs.readdirSync('src/dashboard/css');
        dashboardCssFiles.forEach(file => {
            if (file.endsWith('.css')) {
                copyFile(`src/dashboard/css/${file}`, `public/dashboard/css/${file}`);
            }
        });
    }
    
    // Copy JS files
    if (fs.existsSync('src/js')) {
        const jsFiles = fs.readdirSync('src/js');
        jsFiles.forEach(file => {
            if (file.endsWith('.js')) {
                copyFile(`src/js/${file}`, `public/js/${file}`);
            }
        });
    }
    
    // Copy dashboard JS files
    if (fs.existsSync('src/dashboard/js')) {
        const dashboardJsFiles = fs.readdirSync('src/dashboard/js');
        dashboardJsFiles.forEach(file => {
            if (file.endsWith('.js')) {
                copyFile(`src/dashboard/js/${file}`, `public/dashboard/js/${file}`);
            }
        });
    }
    
    console.log('\n✅ Build complete! Dashboard files included. Run "npm run dev" to start the development server.');
}

buildSite();

