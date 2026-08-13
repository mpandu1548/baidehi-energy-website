const express = require('express');
const { TeamMember, GalleryImage, NewsNotice, ContactMessage } = require('../models');
const { requireAdmin, login } = require('../middleware/auth');
const { uploadTo, uploadManyTo, uploadNewsAssets } = require('../middleware/upload');
const { validateMultipartCsrf } = require('../middleware/csrf');

const router = express.Router();
const resources = {
  team: { model: TeamMember, title: 'Team members', fields: ['name', 'position', 'category', 'bio', 'order', 'isActive'], upload: 'photo', order: [['order', 'ASC'], ['name', 'ASC']] },
  gallery: { model: GalleryImage, title: 'Gallery images', fields: ['title', 'description', 'order', 'isActive'], upload: 'image', order: [['order', 'ASC'], ['created_at', 'DESC']] },
  news: { model: NewsNotice, title: 'News & notices', fields: ['title', 'content', 'publishedDate', 'isPublished'], upload: 'image', order: [['published_date', 'DESC']] },
};

function resource(name) { return resources[name]; }
function valuesFrom(req, config) {
  const values = {};
  config.fields.forEach((field) => {
    if (field === 'isActive' || field === 'isPublished') values[field] = Boolean(req.body[field]);
    else if (field === 'order') values[field] = Number(req.body[field] || 0);
    else values[field] = String(req.body[field] || '').trim();
  });
  if (req.file) values[config.upload] = `${req.uploadFolder}/${req.file.filename}`;
  if (req.files?.image?.[0]) values.image = `${req.uploadFolder}/${req.files.image[0].filename}`;
  if (req.files?.attachment?.[0]) values.attachment = `${req.uploadFolder}/${req.files.attachment[0].filename}`;
  return values;
}

router.route('/login').get((req, res) => res.render('admin/login.html', { page: 'admin' })).post(login);
router.post('/logout', requireAdmin, (req, res) => req.session.destroy(() => res.redirect('/admin/login')));
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [team, gallery, news, messages] = await Promise.all([TeamMember.count(), GalleryImage.count(), NewsNotice.count(), ContactMessage.count()]);
    res.render('admin/dashboard.html', { page: 'admin', adminSection: 'dashboard', counts: { team, gallery, news, messages } });
  } catch (error) { next(error); }
});
router.get('/messages', requireAdmin, async (req, res, next) => {
  try { res.render('admin/messages.html', { page: 'admin', adminSection: 'messages', messages: await ContactMessage.findAll({ order: [['created_at', 'DESC']] }) }); } catch (error) { next(error); }
});
router.get('/gallery/batch', requireAdmin, (req, res) => res.render('admin/gallery-batch.html', { page: 'admin', adminSection: 'gallery' }));
router.post('/gallery/batch', requireAdmin, uploadManyTo('gallery'), validateMultipartCsrf, async (req, res, next) => {
  if (!req.files || !req.files.length) {
    req.flash('error', 'Choose at least one image to upload.');
    return res.redirect('/admin/gallery/batch');
  }
  try {
    const lastOrder = await GalleryImage.max('order') || 0;
    await GalleryImage.bulkCreate(req.files.map((file, index) => ({
      title: file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || `Gallery image ${lastOrder + index + 1}`,
      image: `gallery/${file.filename}`,
      description: '',
      order: lastOrder + index + 1,
      isActive: true,
    })));
    req.flash('success', `${req.files.length} gallery image${req.files.length === 1 ? '' : 's'} uploaded.`);
    return res.redirect('/admin/gallery');
  } catch (error) { return next(error); }
});
router.get('/:name/new', requireAdmin, (req, res) => {
  const config = resource(req.params.name); if (!config) return res.sendStatus(404);
  return res.render('admin/form.html', { page: 'admin', adminSection: req.params.name, config, item: null, name: req.params.name });
});
router.post('/:name', requireAdmin, (req, res, next) => {
  const config = resource(req.params.name); if (!config) return res.sendStatus(404);
  const upload = req.params.name === 'news' ? uploadNewsAssets : uploadTo(req.params.name === 'team' ? 'team' : 'gallery');
  return upload(req, res, async (error) => {
    if (error) return next(error);
    return validateMultipartCsrf(req, res, async (csrfError) => {
      if (csrfError) return next(csrfError);
    try { await config.model.create(valuesFrom(req, config)); return res.redirect(`/admin/${req.params.name}`); } catch (err) { return next(err); }
    });
  });
});
router.get('/:name/:id/edit', requireAdmin, async (req, res, next) => {
  const config = resource(req.params.name); if (!config) return res.sendStatus(404);
  try { const item = await config.model.findByPk(req.params.id); if (!item) return res.sendStatus(404); return res.render('admin/form.html', { page: 'admin', adminSection: req.params.name, config, item: item.get({ plain: true }), name: req.params.name }); } catch (error) { return next(error); }
});
router.post('/:name/:id', requireAdmin, (req, res, next) => {
  const config = resource(req.params.name); if (!config) return res.sendStatus(404);
  const upload = req.params.name === 'news' ? uploadNewsAssets : uploadTo(req.params.name === 'team' ? 'team' : 'gallery');
  return upload(req, res, async (error) => {
    if (error) return next(error);
    return validateMultipartCsrf(req, res, async (csrfError) => {
      if (csrfError) return next(csrfError);
    try { const item = await config.model.findByPk(req.params.id); if (!item) return res.sendStatus(404); await item.update(valuesFrom(req, config)); return res.redirect(`/admin/${req.params.name}`); } catch (err) { return next(err); }
    });
  });
});
router.post('/:name/:id/delete', requireAdmin, async (req, res, next) => {
  const config = resource(req.params.name); if (!config) return res.sendStatus(404);
  try { await config.model.destroy({ where: { id: req.params.id } }); return res.redirect(`/admin/${req.params.name}`); } catch (error) { return next(error); }
});
router.get('/:name', requireAdmin, async (req, res, next) => {
  const config = resource(req.params.name); if (!config) return res.sendStatus(404);
  try { res.render('admin/list.html', { page: 'admin', adminSection: req.params.name, name: req.params.name, config, items: await config.model.findAll({ order: config.order }) }); } catch (error) { next(error); }
});
module.exports = router;
