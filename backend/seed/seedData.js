const { Vehicle } = require('../database/db');
const mongoose = require('mongoose');

const vehiclesToSeed = [
  {
    name: 'Toyota Fortuner Legender',
    type: 'car',
    image: '/images/fortuner_legender.png', // Custom local photorealistic white Fortuner
    pricePerDay: 25000,
    fuelType: 'Diesel',
    transmission: 'Automatic',
    seatingCapacity: 7,
    isAvailable: true,
    location: {
      latitude: 31.5204, // Lahore Center
      longitude: 74.3587,
      address: 'Gulberg III, Lahore, Punjab'
    },
    description: 'The ultimate luxury SUV for family road trips and rugged adventures. Offers 4WD capabilities, a powerful diesel engine, premium leather interior, dual zone climate control, and high safety ratings.',
    badges: ['Family Favorite', '4x4', 'Premium']
  },
  {
    name: 'Honda Civic Oriel',
    type: 'car',
    image: '/images/honda_civic.png', // Custom local photorealistic black Civic
    pricePerDay: 12000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 5,
    isAvailable: true,
    location: {
      latitude: 31.4826,
      longitude: 74.3415,
      address: 'Model Town, Lahore, Punjab'
    },
    description: 'Sleek, sporty, and highly comfortable sedan. Perfect for city travel, executive business trips, or long highway drives. Features sunroof, cruise control, and superb fuel mileage.',
    badges: ['Top Rated', 'Turbo', 'Sporty']
  },
  {
    name: 'Suzuki Alto VXL',
    type: 'car',
    image: '/images/suzuki_alto.png', // Custom local photorealistic white Alto
    pricePerDay: 4500,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 4,
    isAvailable: true,
    location: {
      latitude: 31.4697,
      longitude: 74.2728,
      address: 'Johar Town, Lahore, Punjab'
    },
    description: 'Pakistans most popular fuel-efficient hatchback. Ideal for tight city traffic, easy parking, and extremely budget-friendly. Equipped with air conditioning and automatic AGS transmission.',
    badges: ['Eco Friendly', 'Budget Pick']
  },
  {
    name: 'MG HS Essence',
    type: 'car',
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=600', // Signature Red Crossover SUV
    pricePerDay: 18000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 5,
    isAvailable: true,
    location: {
      latitude: 31.5597,
      longitude: 74.3354,
      address: 'DHA Phase 5, Lahore, Punjab'
    },
    description: 'Premium compact crossover SUV with a gorgeous panoramic sunroof, ambient interior lighting, comprehensive ADAS safety features, and a plush sporty leather interior.',
    badges: ['Sunroof', 'Modern Tech', 'Comfort']
  },
  {
    name: 'Hyundai Tucson AWD',
    type: 'car',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=600', // White Tucson SUV
    pricePerDay: 16000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 5,
    isAvailable: true,
    location: {
      latitude: 31.4789,
      longitude: 74.3820,
      address: 'DHA Phase 3, Lahore, Punjab'
    },
    description: 'A robust and elegant crossover SUV offering All-Wheel Drive stability. Excellent for traveling across hilly areas (like Murree or Northern areas) with supreme passenger comfort.',
    badges: ['All-Wheel Drive', 'Reliable']
  },
  {
    name: 'Changan Alsvin Lumiere',
    type: 'car',
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&q=80&w=600', // Blue family Sedan
    pricePerDay: 7500,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    seatingCapacity: 5,
    isAvailable: true,
    location: {
      latitude: 31.5204,
      longitude: 74.3200,
      address: 'Samnabad, Lahore, Punjab'
    },
    description: 'An exceptionally modern and affordable subcompact sedan. Comes with keyless entry, sunroof, eco-idle mode, and a highly responsive DCT transmission.',
    badges: ['Affordable Sedan', 'Best Value']
  },
  {
    name: 'Yamaha YBR 125G',
    type: 'bike',
    image: '/images/yamaha_ybr125.png', // Custom local sporty YBR bike
    pricePerDay: 2000,
    fuelType: 'Petrol',
    transmission: 'Manual',
    seatingCapacity: 2,
    isAvailable: true,
    location: {
      latitude: 31.5030,
      longitude: 74.3298,
      address: 'Garden Town, Lahore, Punjab'
    },
    description: 'Pakistans favorite dual-sport adventure motorcycle. Equipped with custom shock absorbers, block-pattern tires, and an aggressive off-road style mudguard. Ideal for rugged city streets or solo touring.',
    badges: ['Adventure Bike', 'Solo Rider', 'Economical']
  },
  {
    name: 'Suzuki GS 150 SE',
    type: 'bike',
    image: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?auto=format&fit=crop&q=80&w=600', // Cruiser/Tourer bike
    pricePerDay: 2500,
    fuelType: 'Petrol',
    transmission: 'Manual',
    seatingCapacity: 2,
    isAvailable: true,
    location: {
      latitude: 31.5450,
      longitude: 74.3400,
      address: 'Garhi Shahu, Lahore, Punjab'
    },
    description: 'Powerful 150cc engine bike built for comfortable long-distance highway travel. Features a retro design, self-start capabilities, and an ultra-soft seat that riders love for long journeys.',
    badges: ['Cruiser', 'High Power']
  },
  {
    name: 'Honda CG 125 Self-Start',
    type: 'bike',
    image: '/images/honda_cg125.png', // Custom local red CG 125 commuter motorcycle
    pricePerDay: 1800,
    fuelType: 'Petrol',
    transmission: 'Manual',
    seatingCapacity: 2,
    isAvailable: true,
    location: {
      latitude: 31.4500,
      longitude: 74.3500,
      address: 'Wapda Town, Lahore, Punjab'
    },
    description: 'The iconic powerhouse motorcycle of Pakistan, now featuring electric self-start. Legendary acceleration and speed. Unbeatable for quick urban commuting.',
    badges: ['Commuter King', 'Fast Acceleration']
  },
  {
    name: 'Vlektra Retro Electric Bike',
    type: 'bike',
    image: 'https://images.unsplash.com/photo-1515777315835-281b94c9589f?auto=format&fit=crop&q=80&w=600', // Electric Retro Bike
    pricePerDay: 3000,
    fuelType: 'Electric',
    transmission: 'Automatic',
    seatingCapacity: 2,
    isAvailable: true,
    location: {
      latitude: 31.5,
      longitude: 74.37,
      address: 'Cavalry Ground, Lahore, Punjab'
    },
    description: 'Eco-friendly, completely silent, premium lithium-ion electric motorcycle. Zero emissions, automatic drive, and fully charged in 3 hours. Range of 80km per charge.',
    badges: ['Zero Emissions', 'Silent Drive', 'Eco Champion']
  }
];


async function seed() {
  console.log("Starting database seeding process...");
  
  // Wait a short moment to allow async Mongoose connection in db.js to establish
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Delete existing vehicles (using deleteMany to completely clean the database catalog)
    const deleteRes = await Vehicle.deleteMany({});
    
    // For Mongoose, deleteMany is safer to wipe the entire collection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection('vehicles').deleteMany({});
      console.log("Cleaned existing vehicles from MongoDB.");
    } else {
      console.log("Cleaned vehicles from Local JSON DB.");
    }
    
    // Insert new vehicles
    for (let vehicle of vehiclesToSeed) {
      await Vehicle.create(vehicle);
    }
    
    console.log(`Seeding successful! Seeded ${vehiclesToSeed.length} vehicles.`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
}

seed();
