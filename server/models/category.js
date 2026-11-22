const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    name: { type: String, required: false },
    description: { type: String, required: false },
    movies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }]
});

// sparse: categories created without a name don't collide with each other
categorySchema.index({ name: 1 }, { unique: true, sparse: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;