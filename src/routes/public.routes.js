const express = require('express');
const controller = require('../controllers/public.controller');

const router = express.Router();
router.get('/', controller.home);
router.get('/about/', controller.about);
router.get('/chairman/', controller.chairman);
router.get('/project/', controller.project);
router.get('/gallery/', controller.gallery);
router.get('/team/', controller.team);
router.get('/news/', controller.news);
router.route('/contact/').get(controller.contact).post(controller.submitContact);
module.exports = router;
