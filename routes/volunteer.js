const express = require('express');
const router = express.Router();
const { Volunteer } = require('../models');

// Endpoint to add a volunteer
router.post('/add', async (req, res) => {
    const { profile, name, email, contact, type, status } = req.body;
    try {
        const newVolunteer = await Volunteer.create({ profile, name, email, contact, type, status });
        res.status(201).send(newVolunteer);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
