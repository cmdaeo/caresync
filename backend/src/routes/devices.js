const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getDevices);
router.post('/', deviceController.registerDevice);
router.get('/:id', deviceController.getDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);
router.post('/:deviceId/sync', deviceController.syncStatus);

module.exports = router;
