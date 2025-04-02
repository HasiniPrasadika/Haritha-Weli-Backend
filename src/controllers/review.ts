import { prismaClient } from "..";


// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!productId || !orderId || !rating) {
      return res.status(400).json({ message: 'Product ID, Order ID, and rating are required' });
    }

    // Check if the order belongs to the user
    const order = await prismaClient.order.findFirst({
      where: {
        id: orderId,
        userId: userId
      }
    });

    if (!order) {
      return res.status(403).json({ message: 'You can only review products from your own orders' });
    }

    // Check if the product belongs to the order
    const orderProduct = await prismaClient.orderProduct.findFirst({
      where: {
        orderId: orderId,
        productId: productId
      }
    });

    if (!orderProduct) {
      return res.status(404).json({ message: 'Product not found in this order' });
    }

    // Check if the order status is "DELIVERED"
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({ message: 'You can only review products from delivered orders' });
    }

    // Check if review already exists
    const existingReview = await prismaClient.review.findFirst({
      where: {
        productId: productId,
        orderId: orderId,
        userId: userId
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product for this order' });
    }

    // Create the review
    const review = await prismaClient.review.create({
      data: {
        productId: productId,
        orderId: orderId,
        userId: userId,
        rating: rating,
        comment: comment || ''
      }
    });
    console.error('success review:', review);
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Failed to create review', error: error.message });
  }
};

// Update an existing review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!rating) {
      return res.status(400).json({ message: 'Rating is required' });
    }

    // Check if the review exists and belongs to the user
    const existingReview = await prismaClient.review.findFirst({
      where: {
        id: parseInt(id),
        userId: userId
      }
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found or not authorized to update' });
    }

    // Update the review
    const updatedReview = await prismaClient.review.update({
      where: { id: parseInt(id) },
      data: {
        rating: rating,
        comment: comment || existingReview.comment
      }
    });

    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Failed to update review', error: error.message });
  }
};

// Get all reviews for a specific order
export const getReviewsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // Check if the order belongs to the user
    const order = await prismaClient.order.findFirst({
      where: {
        id: parseInt(orderId),
        userId: userId
      }
    });

    if (!order) {
      return res.status(403).json({ message: 'You can only view reviews for your own orders' });
    }

    // Get all reviews for this order
    const reviews = await prismaClient.review.findMany({
      where: {
        orderId: parseInt(orderId),
        userId: userId
      }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

// Get all reviews for a specific product
export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get all reviews for this product
    const reviews = await prismaClient.review.findMany({
      where: {
        productId: parseInt(productId)
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
    try {
  
  
      // Get all reviews for this product
      const reviews = await prismaClient.review.findMany({
       
        include: {
          user: {
            select: {
              name: true
            }
          }
        }
      });
  
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews', error: error.message });
    }
  };

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the review exists and belongs to the user
    const existingReview = await prismaClient.review.findFirst({
      where: {
        id: parseInt(id),
        userId: userId
      }
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found or not authorized to delete' });
    }

    // Delete the review
    await prismaClient.review.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Failed to delete review', error: error.message });
  }
};

