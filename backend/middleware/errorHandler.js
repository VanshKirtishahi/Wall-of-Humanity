const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON format' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: 'File upload error' });
  }

  res.status(500).json({ message: 'Something broke!' });
};

module.exports = errorHandler; 