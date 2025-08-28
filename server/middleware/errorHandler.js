export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const code = err.status || 500;
  res.status(code).json({ message: err.message || "Server error" });
};
