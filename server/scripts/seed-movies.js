// Usage: npm run seed   (safe to run repeatedly: movies are matched by title)
const mongoose = require('mongoose');
const { connectToDatabase } = require('../db');
const Movie = require('../models/movies');
const Category = require('../models/category');
const MovieAsset = require('../models/movie_assets');
const seedMovies = require('./data/movies.seed.json');

const CATEGORY_DESCRIPTIONS = {
    Action: 'Action-packed movies with thrilling sequences.',
    Comedy: 'Movies that will make you laugh out loud.',
};

async function seed() {
    await connectToDatabase();

    const categories = {};
    for (const name of [...new Set(seedMovies.map((m) => m.category))]) {
        categories[name] = await Category.findOneAndUpdate(
            { name },
            { $setOnInsert: { description: CATEGORY_DESCRIPTIONS[name] } },
            { upsert: true, returnDocument: 'after' }
        );
    }

    let created = 0;
    for (const { title, director, releaseYear, category, image, trailer, video } of seedMovies) {
        const existing = await Movie.exists({ title });

        // $setOnInsert: a movie that already exists keeps its own fields (genre, director, ...)
        const movie = await Movie.findOneAndUpdate(
            { title },
            { $setOnInsert: { director, releaseYear, genre: category } },
            { upsert: true, returnDocument: 'after' }
        );
        if (!existing) created++;

        const assets = {};
        if (image) assets.images = image;
        if (trailer) assets.trailers = trailer;
        if (video) assets.videos = video;
        await MovieAsset.findOneAndUpdate(
            { movieId: movie._id },
            { $addToSet: assets },
            { upsert: true }
        );
        await Category.updateOne({ _id: categories[category]._id }, { $addToSet: { movies: movie._id } });
    }

    console.log(`Seed complete: ${created} movies created, ${seedMovies.length - created} already existed.`);
}

seed()
    .catch((error) => {
        console.error('Seed failed:', error);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
