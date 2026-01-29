import Employee from "../models/Employee.model.js";

const incrementStat = async (employeeId, field) => {
  await Employee.findByIdAndUpdate(employeeId, {
    $inc: { [`stats.${field}`]: 1 },
  });
};

export default {
  incrementStat,
};
