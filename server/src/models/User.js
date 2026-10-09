import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 200 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    /** The learner's full progress document, exactly as the client stores it (see client/src/lib/store.ts). */
    progress: { type: mongoose.Schema.Types.Mixed, default: null },
    progressUpdatedAt: { type: Date, default: null },
    lastSeenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, minimize: false },
);

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    lastSeenAt: this.lastSeenAt,
  };
};

export const User = mongoose.model('User', userSchema);
