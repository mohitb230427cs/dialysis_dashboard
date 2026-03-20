import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema<any>(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, default: null },
    preWeight: { type: Number, required: true },
    postWeight: { type: Number, default: null },
    preSystolicBP: { type: Number, required: true },
    postSystolicBP: { type: Number, default: null },
    nurseNotes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['not started', 'in progress', 'completed'],
      default: 'not started',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        ret.patientId = ret.patientId?.toString?.() ?? ret.patientId;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        ret.patientId = ret.patientId?.toString?.() ?? ret.patientId;
        delete ret._id;
      },
    },
  },
);

export const SessionModel: mongoose.Model<any> =
  (mongoose.models.Session as mongoose.Model<any>) || mongoose.model<any>('Session', sessionSchema);
