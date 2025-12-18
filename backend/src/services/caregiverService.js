const { User, CaregiverPatient } = require('../models');
const logger = require('../utils/logger');
const { AppError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

class CaregiverService {

  /**
   * Get pending invitations for the logged-in caregiver
   */
  async getPendingInvitations(user) {
    const relationships = await CaregiverPatient.findAll({
      where: {
        caregiverId: user.id,
        isVerified: false,
        isActive: true
      },
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      }]
    });

    const invitations = relationships.map(rel => ({
      ...rel.toJSON(),
      patientName: `${rel.patient.firstName} ${rel.patient.lastName}`,
      patientEmail: rel.patient.email
    }));

    return invitations;
  }

  /**
   * Accept a caregiver invitation
   */
  async acceptInvitation(user, id) {
    const relationship = await CaregiverPatient.findOne({
      where: {
        id,
        caregiverId: user.id,
        isVerified: false,
        isActive: true
      }
    });

    if (!relationship) {
      throw new NotFoundError('Invitation not found');
    }

    await relationship.update({ isVerified: true });

    logger.info(`Caregiver ${user.email} accepted invitation ${id}`);

    return relationship;
  }

  /**
   * Get all patients for the logged-in caregiver
   */
  async getPatients(user) {
    const relationships = await CaregiverPatient.findAll({
      where: {
        caregiverId: user.id,
        isVerified: true,
        isActive: true
      },
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture']
      }]
    });

    const patients = relationships.map(rel => ({
      id: rel.id,
      patientId: rel.patient.id,
      relationship: rel.relationship,
      status: rel.isVerified ? 'Active' : 'Pending',
      caregiver: {
        firstName: rel.patient.firstName,
        lastName: rel.patient.lastName,
        email: rel.patient.email,
        phone: rel.patient.phone
      }
    }));

    return patients;
  }

  /**
   * Decline a caregiver invitation
   */
  async declineInvitation(user, id) {
    const relationship = await CaregiverPatient.findOne({
      where: {
        id,
        caregiverId: user.id,
        isVerified: false,
        isActive: true
      }
    });

    if (!relationship) {
      throw new NotFoundError('Invitation not found');
    }

    await relationship.update({ isActive: false });

    logger.info(`Caregiver ${user.email} declined invitation ${id}`);

    return { success: true };
  }

  /**
   * Get all caregivers for the current patient
   */
  async getCaregivers(user) {
    const relationships = await CaregiverPatient.findAll({
      where: { patientId: user.id, isActive: true },
      include: [{
        model: User,
        as: 'caregiver',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'profilePicture']
      }]
    });

    const caregivers = relationships.map(rel => ({
      ...rel.caregiver.toJSON(),
      relationshipId: rel.id,
      relationshipType: rel.relationship,
      permissions: rel.permissions,
      status: rel.isVerified ? 'Active' : 'Pending'
    }));

    return caregivers;
  }

  /**
   * Invite a caregiver by email
   */
  async inviteCaregiver(user, invitationData) {
    const { email, relationship, permissions } = invitationData;

    const caregiverUser = await User.findOne({ where: { email } });

    if (!caregiverUser) {
      throw new NotFoundError('User not found. Please ask them to register first.');
    }

    if (caregiverUser.id === user.id) {
      throw new AppError('You cannot invite yourself.', 400);
    }

    const existing = await CaregiverPatient.findOne({
      where: {
        caregiverId: caregiverUser.id,
        patientId: user.id,
        isActive: true
      }
    });

    if (existing) {
      throw new ConflictError('Caregiver already connected.');
    }

    const link = await CaregiverPatient.create({
      caregiverId: caregiverUser.id,
      patientId: user.id,
      relationship: relationship || 'other',
      permissions: permissions || { viewMedications: true },
      isVerified: false,
      isActive: true
    });

    const Notification = require('../models').Notification;
    await Notification.create({
      userId: user.id,
      caregiverId: caregiverUser.id,
      type: 'caregiveralert',
      title: 'New Caregiver Invitation',
      message: `${user.firstName} ${user.lastName} has invited you to be their caregiver.`,
      isRead: false,
      priority: 'high'
    });

    logger.info(`Caregiver invited: ${email} by ${user.email}`);

    return link;
  }

  /**
   * Remove a caregiver
   */
  async removeCaregiver(user, id) {
    let link = await CaregiverPatient.findByPk(id);

    if (!link) {
      link = await CaregiverPatient.findOne({
        where: { caregiverId: id, patientId: user.id }
      });
    }

    if (!link) {
      throw new NotFoundError('Relationship not found');
    }

    await link.update({ isActive: false });

    return { success: true };
  }
}

module.exports = new CaregiverService();