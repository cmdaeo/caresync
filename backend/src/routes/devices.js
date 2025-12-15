const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getDevices);
router.post('/', deviceController.registerDevice);
router.post('/register-with-signature', deviceController.registerDeviceWithSignature);
router.get('/:id', deviceController.getDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);
router.post('/:deviceId/sync', deviceController.syncStatus);

// Caregiver management routes
router.post('/:deviceId/invite-caregiver', deviceController.inviteCaregiver);
router.post('/:deviceId/caregivers/:invitationId/accept', deviceController.acceptCaregiverInvitation);
router.get('/:deviceId/caregivers', deviceController.getDeviceCaregivers);
router.delete('/:deviceId/caregivers/:caregiverId', deviceController.removeCaregiver);

module.exports = router;
