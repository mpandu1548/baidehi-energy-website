const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  name: { type: DataTypes.STRING(150), allowNull: false },
  position: { type: DataTypes.STRING(150), allowNull: false },
  category: { type: DataTypes.ENUM('leadership', 'board', 'advisor', 'technical', 'corporate'), allowNull: false, defaultValue: 'technical' },
  photo: { type: DataTypes.STRING(255), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
}, { tableName: 'team_members', underscored: true, timestamps: false });

const GalleryImage = sequelize.define('GalleryImage', {
  title: { type: DataTypes.STRING(200), allowNull: false },
  image: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { tableName: 'gallery_images', underscored: true, createdAt: 'created_at', updatedAt: false });

const NewsNotice = sequelize.define('NewsNotice', {
  title: { type: DataTypes.STRING(250), allowNull: false },
  image: { type: DataTypes.STRING(255), allowNull: true },
  attachment: { type: DataTypes.STRING(255), allowNull: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  publishedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'published_date' },
  isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_published' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { tableName: 'news_notices', underscored: true, createdAt: 'created_at', updatedAt: false });

const ContactMessage = sequelize.define('ContactMessage', {
  name: { type: DataTypes.STRING(150), allowNull: false },
  company: { type: DataTypes.STRING(150), allowNull: false, defaultValue: '' },
  email: { type: DataTypes.STRING(254), allowNull: false },
  phone: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '' },
  subject: { type: DataTypes.STRING(250), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { tableName: 'contact_messages', underscored: true, createdAt: 'created_at', updatedAt: false });

module.exports = { sequelize, TeamMember, GalleryImage, NewsNotice, ContactMessage };
