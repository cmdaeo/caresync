const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');

router.get('/', caregiverController.getCaregivers);
router.post('/invite', caregiverController.inviteCaregiver);
router.delete('/:id', caregiverController.removeCaregiver);

module.exports = router;
