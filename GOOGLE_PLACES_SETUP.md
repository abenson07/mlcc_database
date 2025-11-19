# Google Places API Setup Guide

This guide will help you set up the Google Places API to search for businesses in your area.

## Free Tier Benefits

Google Cloud Platform offers **$200 in free credits per month**, which includes:
- **Text Search**: $32 per 1,000 requests (~6,250 free searches/month)
- **Place Details**: $17 per 1,000 requests (~11,765 free details/month)
- **Autocomplete**: $2.83 per 1,000 requests (~70,671 free autocompletes/month)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "MLCC Dashboard")
5. Click "Create"

## Step 2: Enable Places API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Places API"
3. Click on **"Places API"** (the original one)
4. Click **"Enable"**
5. Also enable **"Places API (New)"** if available (this is the newer version)

## Step 3: Create an API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"API Key"**
3. Copy your API key (you'll need it in the next step)

## Step 4: Restrict Your API Key (IMPORTANT for Security)

1. Click on your newly created API key to edit it
2. Under **"API restrictions"**, select **"Restrict key"**
3. Check only:
   - **Places API**
   - **Places API (New)** (if you enabled it)
4. Under **"Application restrictions"**, choose one:
   - **HTTP referrers (web sites)** - Add your domain(s):
     - `localhost:3000/*` (for local development)
     - `yourdomain.com/*` (for production)
   - **IP addresses** - Add your server IPs (if using server-side only)
5. Click **"Save"**

## Step 5: Add API Key to Your Project

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your API key:

```env
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
```

3. Restart your Next.js development server:
```bash
npm run dev
```

## Step 6: Test the Integration

1. Open your application
2. Click "Add New Business"
3. In the search field, try searching for businesses:
   - "restaurants in Toronto"
   - "coffee shops near me"
   - "gyms in [your city]"
4. Select a business from the results
5. The form should auto-fill with the business information

## Usage Tips

### Search Queries

The search function accepts flexible queries:
- **Business name**: "Starbucks"
- **Category + location**: "restaurants in Toronto"
- **Business type**: "coffee shops", "gyms", "restaurants"
- **Near location**: "pizza near [address]"

### Customizing Location

To focus searches on a specific area, you can modify the `searchPlaces` call in `BusinessFormModal.tsx`:

```typescript
// Example: Focus on Toronto area
const results = await searchPlaces(
  query,
  "43.6532,-79.3832", // Toronto coordinates
  10000 // 10km radius
);
```

### Cost Optimization

- Use **debouncing** (already implemented) to reduce API calls
- Only search when user types 3+ characters
- Consider caching results for frequently searched terms
- Use Place Details only when user selects a business (not for all results)

## Troubleshooting

### "API key not configured" error
- Make sure `.env.local` exists and contains `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- Restart your dev server after adding the key
- Check that the variable name is exactly `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

### "REQUEST_DENIED" error
- Check that Places API is enabled in Google Cloud Console
- Verify API key restrictions allow your domain/IP
- Ensure you're using the correct API key

### "OVER_QUERY_LIMIT" error
- You've exceeded your free tier quota
- Check usage in Google Cloud Console > APIs & Services > Dashboard
- Wait for quota reset or upgrade your plan

### No results appearing
- Try different search terms
- Check browser console for errors
- Verify API key is working by testing in Google Cloud Console

## Security Best Practices

1. **Always restrict your API key** to specific APIs and domains
2. **Never commit** `.env.local` to git (it should be in `.gitignore`)
3. **Monitor usage** in Google Cloud Console to detect abuse
4. **Set up billing alerts** to avoid unexpected charges
5. **Use environment-specific keys** for development vs production

## Additional Resources

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Places API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing#places-api)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)



