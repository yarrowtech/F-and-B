import mongoose from "mongoose";

/* Which tables a waiter is responsible for.

   Many-to-many: a table can have several waiters and a waiter several tables.
   REGULAR = the waiter's normal section.
   EXTRA   = temporary cover (waiter absent, crowded hours, events...). */
const waiterTableAssignmentSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    type: {
      type: String,
      enum: ["REGULAR", "EXTRA"],
      default: "REGULAR",
    },

    reason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assignedByModel",
    },

    assignedByModel: {
      type: String,
      enum: ["Admin", "Employee"],
    },

    assignedByName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

waiterTableAssignmentSchema.index({ restaurant: 1, waiter: 1, table: 1 }, { unique: true });
waiterTableAssignmentSchema.index({ restaurant: 1, table: 1 });

export default mongoose.model("WaiterTableAssignment", waiterTableAssignmentSchema);
