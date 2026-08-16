const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_PATH = path.join('/tmp', `baidehi-energy-${process.pid}.sqlite3`);
fs.rmSync(process.env.DATABASE_PATH, { force: true });

const { app, initialiseDatabase } = require('../src/app');
const { csrfProtection, validateMultipartCsrf } = require('../src/middleware/csrf');
const contactController = require('../src/controllers/public.controller');
const { TeamMember, GalleryImage, NewsNotice, ContactMessage, sequelize } = require('../src/models');

function render(view, data) {
  return new Promise((resolve, reject) => app.render(view, data, (error, html) => error ? reject(error) : resolve(html)));
}
function csrfRequest(body = {}) {
  return { method: 'POST', body, session: {}, flash() {} };
}
function csrfResponse() { return { locals: {} }; }
async function applyCsrf(req, res) {
  return new Promise((resolve) => csrfProtection(req, res, (error) => resolve(error)));
}

async function validateMultipart(req, res) {
  return new Promise((resolve) => validateMultipartCsrf(req, res, (error) => resolve(error)));
}

async function main() {
  await initialiseDatabase();
  const [member, image, notice, contactMessage] = await Promise.all([
    TeamMember.create({ name: 'Test Chairman', position: 'Chairman', category: 'leadership', order: 1 }),
    GalleryImage.create({ title: 'Test Gallery Image', image: 'gallery/photo1.jpg', order: 1, createdAt: new Date() }),
    NewsNotice.create({ title: 'Test Notice', content: 'A test notice for route verification.', attachment: 'news/test-notice.pdf', publishedDate: '2026-01-01', createdAt: new Date() }),
    ContactMessage.create({ name: 'Inbox Sender', company: 'Inbox Company', email: 'inbox@example.com', phone: '+977-9811111111', subject: 'Inbox test', message: 'A message for admin action verification.' }),
  ]);
  const galleryImage = { ...image.get({ plain: true }), imageUrl: '/media/gallery/photo1.jpg' };
  const noticeWithAttachment = { ...notice.get({ plain: true }), attachmentUrl: '/media/news/test-notice.pdf' };
  const context = { page: 'home', isAdmin: true, messages: { error: [], success: [] }, csrfToken: 'test-token', members: [member], category_list: [{ grouper: 'Leadership', list: [member] }], images: [galleryImage], notices: [notice], latest_news: [notice], notice: noticeWithAttachment, gallery_images: [galleryImage], aboutImage: galleryImage, aboutProjectImage: galleryImage, projectImage: galleryImage, message_sent: false, config: { title: 'Team members', fields: ['name', 'position', 'category', 'bio', 'order', 'isActive'], upload: 'photo' }, name: 'team', items: [member], item: member, counts: { team: 1, gallery: 1, news: 1, messages: 1 }, messagesList: [contactMessage] };
  for (const page of ['home.html', 'about.html', 'chairman.html', 'project.html', 'gallery.html', 'team.html', 'news.html', 'news-detail.html', 'contact.html', 'admin/login.html', 'admin/dashboard.html', 'admin/list.html', 'admin/form.html', 'admin/messages.html', 'admin/gallery-batch.html']) {
    const html = await render(page, { ...context, notices: [noticeWithAttachment], latest_news: [noticeWithAttachment] });
    assert.ok(html.length > 100, `${page} should render content`);
    if (page === 'home.html' || page === 'about.html') assert.match(html, /\/media\/gallery\/photo1\.jpg/, `${page} should use configured gallery imagery`);
    if (page === 'project.html') assert.match(html, /project-showcase/, 'Project page should use a dedicated two-column introduction');
    if (page === 'gallery.html') assert.doesNotMatch(html, />\s*Test Gallery Image\s*</, 'Gallery should not show image title captions');
    if (page === 'gallery.html') assert.match(html, /gallery-lightbox/, 'Gallery should include a fullscreen lightbox');
    if (page === 'news.html') assert.match(html, /\/media\/news\/test-notice\.pdf/, 'News should render a document download link');
    if (page === 'news.html' || page === 'home.html') assert.match(html, /\/news\/\d+\//, `${page} should link to a readable news page`);
    if (page === 'news-detail.html') assert.match(html, /Back to News/, 'News detail should include a route back to the index');
    if (page === 'home.html' || page === 'contact.html') assert.match(html, /27\.127831[^\d]+85\.389214/, `${page} should use the configured map coordinates`);
    if (page === 'contact.html') {
      assert.match(html, /name="company"[\s\S]*?required/, 'Company should be required');
      assert.match(html, /name="phone"[\s\S]*?required/, 'Phone should be required');
    }
    if (page === 'admin/messages.html') {
      assert.match(html, /Mark as read/, 'Admin inbox should support marking a message as read');
      assert.match(html, /\/naren\/messages\/\d+\/delete/, 'Admin inbox should support deleting a message');
    }
  }

  const rejectedRequest = csrfRequest();
  const rejectedResponse = csrfResponse();
  const rejected = await applyCsrf(rejectedRequest, rejectedResponse);
  assert.equal(rejected.status, 403, 'CSRF should reject an unsafe request without a token');

  const acceptedRequest = csrfRequest();
  const acceptedResponse = csrfResponse();
  const firstPass = await applyCsrf(acceptedRequest, acceptedResponse);
  assert.equal(firstPass.status, 403, 'The initial unsafe request must still be rejected');
  acceptedRequest.body._csrf = acceptedRequest.session.csrfToken;
  assert.equal(await applyCsrf(acceptedRequest, acceptedResponse), undefined, 'Matching CSRF token should be accepted');

  const requestWithRotatedSession = csrfRequest({ _csrf: acceptedRequest.session.csrfToken });
  assert.equal(await applyCsrf(requestWithRotatedSession, csrfResponse()), undefined, 'A signed token should survive a session-store change');

  const multipartRequest = csrfRequest();
  multipartRequest.is = (type) => type === 'multipart/form-data';
  assert.equal(await applyCsrf(multipartRequest, csrfResponse()), undefined, 'Multipart requests should wait for Multer to parse their fields');
  multipartRequest.body._csrf = multipartRequest.session.csrfToken;
  assert.equal(await validateMultipart(multipartRequest, csrfResponse()), undefined, 'Multipart requests should validate after parsing');

  const redirects = [];
  const submission = { body: { name: 'Test Sender', company: 'Test Company', email: 'sender@example.com', phone: '+977-9800000000', subject: 'Test enquiry', message: 'Please contact me.' }, flash() {} };
  const response = { redirect: (location) => redirects.push(location), status() { return this; }, render() { throw new Error('Expected valid submission to redirect'); } };
  await contactController.submitContact(submission, response, (error) => { throw error; });
  assert.deepEqual(redirects, ['/contact/?sent=1']);
  assert.equal(await ContactMessage.count(), 2);

  let missingFieldStatus;
  const incompleteSubmission = { body: { ...submission.body, phone: '' }, flash() {} };
  const incompleteResponse = { redirect() { throw new Error('Incomplete submission must not redirect'); }, status(status) { missingFieldStatus = status; return this; }, render() {} };
  await contactController.submitContact(incompleteSubmission, incompleteResponse, (error) => { throw error; });
  assert.equal(missingFieldStatus, 422, 'Every contact field should be required by the server');
  console.log('Smoke tests passed: templates, CSRF, and contact persistence.');
}

main().then(async () => { await sequelize.close(); fs.rmSync(process.env.DATABASE_PATH, { force: true }); }).catch(async (error) => { console.error(error); await sequelize.close(); fs.rmSync(process.env.DATABASE_PATH, { force: true }); process.exit(1); });
