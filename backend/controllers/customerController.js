import Customer from '../models/Customer.js';
import StockOrder from '../models/StockOrder.js';
import { sendEmail } from '../utils/emailService.js';

// Get all customers
export const getCustomers = async (req, res) => {
  try {
    // Only admins can view all customers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view customer data'
      });
    }
    
    // Optional filtering
    const query = {};
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;
    
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const totalCustomers = await Customer.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: customers.length,
      total: totalCustomers,
      pages: Math.ceil(totalCustomers / limit),
      customers
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    // Only admins can view customer details
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view customer details'
      });
    }
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message
    });
  }
};

// Create new customer
export const createCustomer = async (req, res) => {
  try {
    // Only admins can create customers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create customers'
      });
    }
    
    const {
      name,
      email,
      phone,
      address,
      company,
      type,
      notes,
      isSubscribedToAlerts
    } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required fields'
      });
    }
    
    // Check if customer with this email already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists'
      });
    }
    
    const customer = new Customer({
      name,
      email,
      phone,
      address,
      company,
      type: type || 'individual',
      notes,
      isSubscribedToAlerts: isSubscribedToAlerts || false,
      createdBy: req.user._id
    });
    
    await customer.save();
    
    // Send welcome email if subscribed to alerts
    if (customer.isSubscribedToAlerts) {
      try {
        await sendEmail(
          customer.email,
          'Welcome to Stock Alert Notifications',
          `Hello ${customer.name},\n\nYou have been subscribed to receive stock alerts from our Tourism & Travel Management System. You will be notified whenever items of interest are running low or out of stock.\n\nThank you for your business!`
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the whole request if just the email fails
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    // Only admins can update customers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update customers'
      });
    }
    
    const {
      name,
      email,
      phone,
      address,
      company,
      type,
      notes,
      isSubscribedToAlerts
    } = req.body;
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Update fields if provided
    if (name) customer.name = name;
    if (email) {
      // Check if another customer is using this email
      const existingCustomer = await Customer.findOne({ email, _id: { $ne: customer._id } });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Another customer is already using this email'
        });
      }
      customer.email = email;
    }
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (company !== undefined) customer.company = company;
    if (type) customer.type = type;
    if (notes !== undefined) customer.notes = notes;
    
    // Check if subscription status changed
    const wasSubscribed = customer.isSubscribedToAlerts;
    if (isSubscribedToAlerts !== undefined) {
      customer.isSubscribedToAlerts = isSubscribedToAlerts;
      
      // Send subscription status notification if changed
      if (wasSubscribed !== isSubscribedToAlerts) {
        try {
          await sendEmail(
            customer.email,
            isSubscribedToAlerts ? 'Stock Alert Subscription Activated' : 'Stock Alert Subscription Deactivated',
            isSubscribedToAlerts
              ? `Hello ${customer.name},\n\nYou have been subscribed to receive stock alerts from our Tourism & Travel Management System.`
              : `Hello ${customer.name},\n\nYou have been unsubscribed from receiving stock alerts from our Tourism & Travel Management System.`
          );
        } catch (emailError) {
          console.error('Failed to send subscription update email:', emailError);
          // Don't fail the whole request if just the email fails
        }
      }
    }
    
    customer.updatedAt = Date.now();
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    // Only admins can delete customers
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete customers'
      });
    }
    
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer has orders
    const hasOrders = await StockOrder.exists({ customer: customer._id });
    
    if (hasOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders. Consider deactivating instead.'
      });
    }
    
    await Customer.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

// Get customer orders
export const getCustomerOrders = async (req, res) => {
  try {
    // Only admins can view customer orders
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view customer orders'
      });
    }
    
    const customerId = req.params.id;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Get orders for this customer
    const orders = await StockOrder.find({ customer: customerId })
      .populate('supplier', 'name')
      .populate('orderedItems.equipment', 'name price')
      .sort({ orderDate: -1 });
    
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer orders',
      error: error.message
    });
  }
};

// Subscribe customer to alerts
export const subscribeToAlerts = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Update subscription status
    customer.isSubscribedToAlerts = true;
    await customer.save();
    
    // Send confirmation email
    try {
      await sendEmail(
        customer.email,
        'Stock Alert Subscription Confirmed',
        `Hello ${customer.name},\n\nYou have successfully subscribed to receive stock alerts from our Tourism & Travel Management System. You will be notified whenever items of interest are running low or out of stock.\n\nThank you!`
      );
    } catch (emailError) {
      console.error('Failed to send subscription confirmation email:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer subscribed to alerts successfully'
    });
  } catch (error) {
    console.error('Error subscribing customer to alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe customer to alerts',
      error: error.message
    });
  }
};
