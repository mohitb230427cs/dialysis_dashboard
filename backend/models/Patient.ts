import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema<any>(
  {
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    dryWeight: { type: Number, required: true },
    unit: { type: String, required: true },
    machineId: { type: String, required: true },
    scheduledTime: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret._id;
      },
    },
  },
);

export const PatientModel: mongoose.Model<any> =
  (mongoose.models.Patient as mongoose.Model<any>) || mongoose.model<any>('Patient', patientSchema);
