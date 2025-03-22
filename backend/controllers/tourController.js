import Tour from '../models/Tour.js';

export const createTour = async (req, res) => {
  try {
    const { name, description, location, price, duration, date } = req.body;
    
    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Create the image path
    const image = `uploads/${req.file.filename}`;

    const tour = await Tour.create({
      name,
      description,
      location,
      price: Number(price),
      duration: Number(duration),
      date,
      image
    });

    res.status(201).json(tour);
  } catch (error) {
    console.error('Tour creation error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    res.status(200).json(tours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.status(200).json(tour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTour = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }

    const tour = await Tour.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.status(200).json(tour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.status(200).json({ message: 'Tour deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
