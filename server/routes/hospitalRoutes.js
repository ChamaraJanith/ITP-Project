// routes/hospitalRoutes.js - 100% FREE OpenStreetMap Version
import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get nearby hospitals using OpenStreetMap Overpass API (FREE!)
router.get('/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Latitude and longitude are required' 
      });
    }

    console.log(`🏥 Fetching hospitals near: ${latitude}, ${longitude} using OpenStreetMap`);

    // OpenStreetMap Overpass API Query - 100% FREE!
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${latitude},${longitude});
        way["amenity"="hospital"](around:${radius},${latitude},${longitude});
        relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
      );
      out center;
      out tags;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    const data = await response.json();

    console.log(`✅ Found ${data.elements?.length || 0} hospitals from OpenStreetMap`);
    
    // Format response to match Google Places API structure
    const formattedData = {
      status: data.elements && data.elements.length > 0 ? 'OK' : 'ZERO_RESULTS',
      results: data.elements ? data.elements
        .filter(el => el.tags && el.tags.name)
        .map(element => {
          const lat = element.lat || (element.center && element.center.lat);
          const lon = element.lon || (element.center && element.center.lon);
          
          return {
            place_id: `osm_${element.type}_${element.id}`,
            name: element.tags.name,
            vicinity: formatAddress(element.tags),
            geometry: {
              location: {
                lat: lat,
                lng: lon
              }
            },
            rating: generateRating(),
            user_ratings_total: Math.floor(Math.random() * 500) + 50,
            types: ['hospital', 'health'],
            opening_hours: element.tags.opening_hours ? {
              open_now: element.tags.opening_hours === '24/7'
            } : undefined,
            photos: null,
            tags: element.tags // Keep original OSM tags for details
          };
        }) : []
    };

    res.json(formattedData);
  } catch (error) {
    console.error('❌ Error fetching hospitals:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch hospitals',
      message: error.message,
      status: 'ERROR'
    });
  }
});

// Get place details from OSM data
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    console.log(`📋 Fetching details for: ${placeId}`);

    // Extract OSM ID from place_id
    const osmMatch = placeId.match(/osm_(\w+)_(\d+)/);
    
    if (!osmMatch) {
      return res.status(400).json({
        error: 'Invalid place ID format',
        status: 'INVALID_REQUEST'
      });
    }

    const [, type, id] = osmMatch;
    
    // Fetch detailed info from OSM
    const overpassQuery = `
      [out:json];
      ${type}(${id});
      out body;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    const data = await response.json();
    
    if (!data.elements || data.elements.length === 0) {
      return res.status(404).json({
        error: 'Place not found',
        status: 'NOT_FOUND'
      });
    }

    const element = data.elements[0];
    const tags = element.tags || {};

    res.json({
      status: 'OK',
      result: {
        name: tags.name,
        formatted_phone_number: tags.phone || tags['contact:phone'] || 'Not available',
        website: tags.website || tags['contact:website'],
        opening_hours: tags.opening_hours ? {
          weekday_text: [tags.opening_hours]
        } : undefined,
        rating: generateRating(),
        user_ratings_total: Math.floor(Math.random() * 500) + 50,
        photos: null,
        tags: tags
      }
    });

  } catch (error) {
    console.error('❌ Error fetching place details:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch place details',
      message: error.message,
      status: 'ERROR'
    });
  }
});

// Get photo URL - return placeholder for OSM
router.get('/photo/:photoReference', async (req, res) => {
  try {
    // For OSM, return Unsplash hospital images
    const hospitalImages = [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400',
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400',
      'https://images.unsplash.com/photo-1504439904031-93ded9f93e4e?w=400',
    ];
    
    const randomImage = hospitalImages[Math.floor(Math.random() * hospitalImages.length)];
    
    res.json({ photoUrl: randomImage });
  } catch (error) {
    console.error('❌ Error generating photo URL:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate photo URL',
      message: error.message 
    });
  }
});

// Helper function to format OSM address
function formatAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

// Helper function to generate rating
function generateRating() {
  return parseFloat((Math.random() * 1.5 + 3.5).toFixed(1));
}

export default router;
