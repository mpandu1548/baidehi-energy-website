const { activeMembers, activeGallery, publishedNews, publishedNewsById, categoryLabels, categoryOrder } = require('../services/content');
const { ContactMessage } = require('../models');
const contactEmail = require('../services/contact-email');

function render(res, view, page, data = {}) {
  return res.render(view, { page, ...data });
}

exports.home = async (req, res, next) => {
  try {
    const [latest_news, gallery_images] = await Promise.all([publishedNews(3), activeGallery()]);
    return render(res, 'home.html', 'home', {
      latest_news,
      gallery_images: gallery_images.slice(0, 3),
      aboutImage: gallery_images[3] || gallery_images[0],
      projectImage: gallery_images[4] || gallery_images[1] || gallery_images[0],
    });
  } catch (error) { return next(error); }
};
exports.about = async (req, res, next) => {
  try {
    const [members, galleryImages] = await Promise.all([activeMembers(), activeGallery()]);
    const category_list = categoryOrder
      .map((category) => ({ grouper: categoryLabels[category], list: members.filter((member) => member.category === category) }))
      .filter((group) => group.list.length);
    return render(res, 'about.html', 'about', { category_list, aboutProjectImage: galleryImages[5] || galleryImages[0] });
  } catch (error) { return next(error); }
};
exports.project = async (req, res, next) => {
  try {
    const galleryImages = await activeGallery();
    return render(res, 'project.html', 'project', { projectImage: galleryImages[6] || galleryImages[0] });
  } catch (error) { return next(error); }
};
exports.chairman = async (req, res, next) => {
  try {
    // The Chairman's portrait is managed with the team directory, so this page
    // always uses the same image visitors see in Our Team.
    const chairman = (await activeMembers()).find((member) => /\bchairman\b/i.test(member.position));
    return render(res, 'chairman.html', 'chairman', { chairman });
  } catch (error) { return next(error); }
};
exports.gallery = async (req, res, next) => {
  try { return render(res, 'gallery.html', 'gallery', { images: await activeGallery() }); } catch (error) { return next(error); }
};
exports.team = async (req, res, next) => {
  try {
    const members = await activeMembers();
    const category_list = categoryOrder.map((category) => ({ grouper: categoryLabels[category], list: members.filter((member) => member.category === category) })).filter((group) => group.list.length);
    return render(res, 'team.html', 'team', { members, category_list });
  } catch (error) { return next(error); }
};
exports.news = async (req, res, next) => {
  try { return render(res, 'news.html', 'news', { notices: await publishedNews() }); } catch (error) { return next(error); }
};
exports.newsDetail = async (req, res, next) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(404).send('News item not found');
  try {
    const notice = await publishedNewsById(id);
    if (!notice) return res.status(404).send('News item not found');
    return render(res, 'news-detail.html', 'news', { notice });
  } catch (error) { return next(error); }
};
exports.contact = (req, res) => render(res, 'contact.html', 'contact', { message_sent: req.query.sent === '1' });
exports.submitContact = async (req, res, next) => {
  const fields = ['name', 'company', 'email', 'phone', 'subject', 'message'];
  if (fields.some((field) => !String(req.body[field] || '').trim())) {
    req.flash('error', 'Please complete all required fields.');
    return res.status(422).render('contact.html', { page: 'contact', message_sent: false, form: req.body });
  }
  if (!/^\S+@\S+\.\S+$/.test(req.body.email)) {
    req.flash('error', 'Please enter a valid email address.');
    return res.status(422).render('contact.html', { page: 'contact', message_sent: false, form: req.body });
  }
  try {
    const contact = await ContactMessage.create({ name: req.body.name.trim(), company: String(req.body.company || '').trim(), email: req.body.email.trim(), phone: String(req.body.phone || '').trim(), subject: req.body.subject.trim(), message: req.body.message.trim() });
    try {
      await contactEmail.sendContactEmail(contact);
    } catch (emailError) {
      console.error('Unable to send contact-form email notification:', emailError);
      req.flash('error', 'Your message was saved, but we could not send the email notification. Please try again later.');
      return res.redirect('/contact/');
    }
    return res.redirect('/contact/?sent=1');
  } catch (error) { return next(error); }
};
