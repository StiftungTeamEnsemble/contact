# Team Ensemble Contact Cards

A static site generator for contact cards with vCard download support.

## Project Structure

```
├── data/                 # YAML contact data files
│   └── nicola.forster.yml
├── templates/            # Handlebars HTML templates
│   └── card.html
├── scripts/              # Build scripts
│   └── build.js
├── assets/               # Static assets
├── dist/                 # Generated output (gitignored)
└── .github/workflows/    # GitHub Actions
    └── deploy.yml
```

## Adding a New Contact

1. Create a new YAML file in the `data/` folder (e.g., `firstname.lastname.yml`)
2. Use the following structure:

```yaml
name:
  first: Firstname
  last: Lastname
  full: Firstname Lastname
  credentials: Dr. # optional

title: Job Title

contact:
  phone:
    mobile: "+41 79 123 45 67"
  email: firstname.lastname@team-ensemble.ch
  website: https://team-ensemble.ch

social:
  linkedin: https://www.linkedin.com/in/username/
```

3. Push to `main` branch - the site will automatically rebuild and deploy.

## Local Development

```bash
# Install dependencies
npm install

# Build the site
npm run build

# Build and serve locally
npm run dev
```

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

## Output

For each contact, the generator creates:

- `dist/{slug}/index.html` - Contact card page
- `dist/{slug}/{First}-{Last}.vcf` - vCard download file
