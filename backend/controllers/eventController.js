import Event from '../models/Event.js';
import User from '../models/User.js';

// Create a new event
export const createEvent = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      date, 
      time, 
      location, 
      category, 
      capacity, 
      price
    } = req.body;
    
    // Handle the uploaded image file
    const imagePath = req.file 
      ? `/uploads/events/${req.file.filename}` 
      : 'default-event.jpg';

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      category,
      capacity: Number(capacity),
      price: Number(price) || 0,
      image: imagePath,
      organizer: req.user.id,
      isApproved: req.user.role === 'admin' // Auto approve if admin creates it
    });

    const savedEvent = await event.save();

    res.status(201).json({
      success: true,
      event: savedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// Get all events
// Admins see all events, users see only approved events
export const getAllEvents = async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show approved events
    if (req.user.role !== 'admin') {
      query.isApproved = true;
    }
    
    const events = await Event.find(query)
      .populate('organizer', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Get events created by current user
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your events',
      error: error.message
    });
  }
};

// Get pending events (admin only)
export const getPendingEvents = async (req, res) => {
  try {
    // Only admins can see pending events
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access pending events'
      });
    }

    const events = await Event.find({ isApproved: false })
      .populate('organizer', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending events',
      error: error.message
    });
  }
};

// Get single event
export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username email')
      .populate('attendees', 'username email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // If event is not approved and user is not admin or organizer, don't show it
    if (!event.isApproved && 
        req.user.role !== 'admin' && 
        event.organizer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'This event is not available'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

// Get single event (public access)
export const getPublicEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username email')
      .populate('attendees', 'username email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // For public access, only show approved events
    if (!event.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

// Get all public events (no authentication required)
export const getPublicEvents = async (req, res) => {
  try {
    // Only show approved events to the public
    const events = await Event.find({ isApproved: true })
      .populate('organizer', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Update event
export const updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is authorized to update (admin or event organizer)
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    const updateData = { ...req.body };
    
    // Handle image upload if a new file is provided
    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
    }

    // If regular user is updating, set approval back to false
    if (req.user.role !== 'admin') {
      updateData.isApproved = false;
    }

    event = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Approve or reject event (admin only)
export const approveEvent = async (req, res) => {
  try {
    const { isApproved } = req.body;

    // Only admins can approve events
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve events'
      });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, 
      { isApproved },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve event',
      error: error.message
    });
  }
};

// Delete event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is authorized to delete (admin or event organizer)
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

// Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is approved
    if (!event.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for unapproved event'
      });
    }

    // Check if user is already registered
    if (event.attendees.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Check if event is at capacity
    if (event.attendees.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is at full capacity'
      });
    }

    // Extract additional registration details
    const { numberOfTickets = 1, specialRequirements = '' } = req.body;
    
    // Add to attendees
    event.attendees.push(req.user.id);
    
    // You might want to store the additional details in a separate collection
    // or as an object in the event document
    
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully registered for event',
      numberOfTickets,
      specialRequirements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register for event',
      error: error.message
    });
  }
};
