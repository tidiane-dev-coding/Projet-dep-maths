import { Schema, model } from 'mongoose'

const StaffMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    title: { type: String, required: true },
    responsibility: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    office: { type: String, required: true },
    bio: { type: String, required: true },
    focus: { type: [String], default: [] },
    photo: { type: String },
  },
  { timestamps: true }
)

export default model('StaffMember', StaffMemberSchema)

