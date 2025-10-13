import jwt from 'jsonwebtoken';

// Make sure to have a JWT_SECRET in your .env file for security
// Example: JWT_SECRET = your-super-secret-and-long-key
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

const authenticateUser = async (req, res, next) => {
  // Get the token from the header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  // Extract the token without the "Bearer " prefix
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the user payload (id, role) to the request object
    // This makes it available in subsequent middleware or route handlers
    req.user = { id: decoded.id, role: decoded.role };
    
    // Proceed to the next middleware or the controller
    next();
  } catch (error) {
    // If token is invalid or expired
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

export { authenticateUser };