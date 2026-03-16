import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IProducerOrganization extends Document {
  organizationId: string
  companyName: string
  legalName: string
  registrationNumber: string
  vatNumber: string
  address: string
  website: string
  onboardingComplete: boolean
  primaryContact: {
    name: string
    email: string
    phone: string
  }
  source: string
  updatedAt: Date
  createdAt: Date
  lastSyncedAt: Date
}

const ProducerOrganizationSchema: Schema<IProducerOrganization> = new Schema(
  {
    organizationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
    },
    legalName: {
      type: String,
      default: '',
      trim: true,
    },
    registrationNumber: {
      type: String,
      default: '',
      trim: true,
    },
    vatNumber: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    primaryContact: {
      name: { type: String, default: '', trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
      phone: { type: String, default: '', trim: true },
    },
    source: {
      type: String,
      default: 'producer-dashboard',
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: 'lastSyncedAt',
    },
  }
)

const ProducerOrganization: Model<IProducerOrganization> =
  mongoose.models.ProducerOrganization ||
  mongoose.model<IProducerOrganization>('ProducerOrganization', ProducerOrganizationSchema)

export default ProducerOrganization
