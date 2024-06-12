const express = require('express');
const router = express.Router();
const { Volunteer } = require('../models');

// Endpoint to get all volunteers
router.get('/volunteers', async (req, res) => {
    try {
        const volunteers = await Volunteer.findAll();
        res.status(200).send(volunteers);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint to delete a volunteer
router.delete('/volunteers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Volunteer.destroy({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
