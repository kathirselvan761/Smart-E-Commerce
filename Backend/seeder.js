import mongoose from 'mongoose'
import dotenv from 'dotenv'
import colors from 'colors'
import users from './data/users.js'
import products from './data/products.js'
import User from './models/userModel.js'
import Product from './models/productModel.js'
import Order from './models/orderModel.js'
import connectDB from './config/db.js'

dotenv.config()

connectDB()

const importData = async () => {
  try {
    await Order.deleteMany()
    await Product.deleteMany()
    await User.deleteMany()

    const createdUsers = await User.insertMany(users)
    const adminUser = createdUsers[0]._id

    // ✅ Map sample products and ensure they have three images
    const sampleProducts = products.map((product) => {
      // If original product has only one image field, create three placeholders
      let updatedImages = []
      if (product.images && Array.isArray(product.images)) {
        updatedImages = product.images.slice(0, 3) // take first 3 images if available
      } else {
        // fallback: use the single image for all three slots
        updatedImages = [product.image, product.image, product.image]
      }

      return {
        ...product,
        user: adminUser,
        images: updatedImages, // ✅ ensure images array exists
      }
    })

    await Product.insertMany(sampleProducts)

    console.log('✅ Data Imported'.green.inverse)
    process.exit()
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red.inverse)
    process.exit(1)
  }
}

const destroyData = async () => {
  try {
    await Order.deleteMany()
    await Product.deleteMany()
    await User.deleteMany()

    console.log('❌ Data Destroyed!'.red.inverse)
    process.exit()
  } catch (error) {
    console.error(`❌ Error: ${error.message}`.red.inverse)
    process.exit(1)
  }
}

if (process.argv[2] === '-d') {
  destroyData()
} else {
  importData()
}
