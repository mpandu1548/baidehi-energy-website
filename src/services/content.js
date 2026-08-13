const { Op } = require('sequelize');
const { TeamMember, GalleryImage, NewsNotice } = require('../models');

const categoryLabels = { leadership: 'Leadership', board: 'Board of Directors', advisor: 'Advisors', technical: 'Technical Team', corporate: 'Corporate Support' };
const categoryOrder = ['leadership', 'board', 'advisor', 'technical', 'corporate'];

function present(record, imageField) {
  const data = record.get ? record.get({ plain: true }) : record;
  if (imageField && data[imageField]) data[`${imageField}Url`] = `/media/${data[imageField].replace(/^\/+/, '')}`;
  if (data.attachment) data.attachmentUrl = `/media/${data.attachment.replace(/^\/+/, '')}`;
  data.categoryLabel = categoryLabels[data.category] || data.category;
  return data;
}

async function activeMembers() {
  const members = await TeamMember.findAll({ where: { isActive: true }, order: [['order', 'ASC'], ['name', 'ASC']] });
  return members.map((member) => present(member, 'photo')).sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category));
}

async function activeGallery(limit) {
  const options = { where: { isActive: true }, order: [['order', 'ASC'], ['created_at', 'DESC']] };
  if (limit) options.limit = limit;
  return (await GalleryImage.findAll(options)).map((image) => present(image, 'image'));
}

async function publishedNews(limit) {
  const options = { where: { isPublished: true, publishedDate: { [Op.not]: null } }, order: [['published_date', 'DESC'], ['created_at', 'DESC']] };
  if (limit) options.limit = limit;
  return (await NewsNotice.findAll(options)).map((notice) => present(notice, 'image'));
}

async function publishedNewsById(id) {
  const notice = await NewsNotice.findOne({
    where: { id, isPublished: true, publishedDate: { [Op.not]: null } },
  });
  return notice ? present(notice, 'image') : null;
}

module.exports = { activeMembers, activeGallery, publishedNews, publishedNewsById, categoryLabels, categoryOrder, present };
