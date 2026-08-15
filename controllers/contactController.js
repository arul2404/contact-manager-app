const Contact = require('../models/Contact');

const PALETTE = [
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#7c3aed', // Purple
  '#d97706', // Amber
  '#dc2626', // Red
  '#059669', // Emerald
  '#4f46e5', // Indigo
  '#c026d3', // Fuchsia
  '#ea580c', // Orange
];

const getRandomColor = () => {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
};

// @desc    Get all contacts for authenticated user with search, filter & sort
// @route   GET /api/contacts
// @access  Private
exports.getContacts = async (req, res, next) => {
  try {
    const { q, category, favorite, sort } = req.query;

    const filter = { user: req.user._id };

    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Favorite filter
    if (favorite === 'true') {
      filter.isFavorite = true;
    }

    // Search query filter (matches name, email, phone, company, address)
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { address: searchRegex },
      ];
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default newest first
    if (sort === 'name_asc') {
      sortOptions = { name: 1 };
    } else if (sort === 'name_desc') {
      sortOptions = { name: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const contacts = await Contact.find(filter).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single contact by ID
// @route   GET /api/contacts/:id
// @access  Private
exports.getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new contact
// @route   POST /api/contacts
// @access  Private
exports.createContact = async (req, res, next) => {
  try {
    const { name, email, phone, category, company, address, notes, isFavorite, avatarColor } =
      req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Contact name is required',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    const contact = await Contact.create({
      user: req.user._id,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : '',
      phone: phone.trim(),
      category: category || 'Personal',
      company: company ? company.trim() : '',
      address: address ? address.trim() : '',
      notes: notes ? notes.trim() : '',
      isFavorite: Boolean(isFavorite),
      avatarColor: avatarColor || getRandomColor(),
    });

    res.status(201).json({
      success: true,
      message: 'Contact added successfully',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing contact
// @route   PUT /api/contacts/:id
// @access  Private
exports.updateContact = async (req, res, next) => {
  try {
    const { name, email, phone, category, company, address, notes, isFavorite } = req.body;

    let contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    if (name !== undefined) contact.name = name.trim();
    if (email !== undefined) contact.email = email.trim().toLowerCase();
    if (phone !== undefined) contact.phone = phone.trim();
    if (category !== undefined) contact.category = category;
    if (company !== undefined) contact.company = company.trim();
    if (address !== undefined) contact.address = address.trim();
    if (notes !== undefined) contact.notes = notes.trim();
    if (isFavorite !== undefined) contact.isFavorite = Boolean(isFavorite);

    const updatedContact = await contact.save();

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      data: updatedContact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a contact
// @route   DELETE /api/contacts/:id
// @access  Private
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found or already deleted',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite status for contact
// @route   PATCH /api/contacts/:id/favorite
// @access  Private
exports.toggleFavorite = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    contact.isFavorite = !contact.isFavorite;
    await contact.save();

    res.status(200).json({
      success: true,
      message: contact.isFavorite
        ? 'Contact marked as favorite'
        : 'Contact removed from favorites',
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get contact statistics for dashboard
// @route   GET /api/contacts/stats/summary
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const total = await Contact.countDocuments({ user: userId });
    const favorites = await Contact.countDocuments({ user: userId, isFavorite: true });

    const categoriesAgg = await Contact.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const categories = {
      Personal: 0,
      Work: 0,
      Family: 0,
      Client: 0,
      Other: 0,
    };

    categoriesAgg.forEach((item) => {
      if (item._id && categories.hasOwnProperty(item._id)) {
        categories[item._id] = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        favorites,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};
