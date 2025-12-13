import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    images: [String],
    brand: { type: String, required: true },
    category: { type: String, required: true },
    countInStock: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    Highlights: { type: [String], default: [] },
  },
  { timestamps: true }
)



// ✅ Validator function for max 3 images
function arrayLimit(val) {
  return val.length <= 3;
}

const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
