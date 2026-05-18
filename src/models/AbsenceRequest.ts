import { Schema, model, Types } from 'mongoose';

const AbsenceRequestSchema = new Schema({
  studentId: { type: Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  classe: { type: String },
  requestType: {
    type: String,
    enum: ['conge', 'absence', 'lettre'],
    default: 'absence',
  },
  addressee: {
    type: String,
    enum: ['chef_departement', 'recteur'],
    default: 'chef_departement',
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  attachmentUrl: { type: String },
  attachmentName: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewNote: { type: String },
  reviewedByEmail: { type: String },
  reviewedByName: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true });

export default model('AbsenceRequest', AbsenceRequestSchema);
