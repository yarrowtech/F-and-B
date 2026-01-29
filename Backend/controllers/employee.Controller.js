


const Employee = require('../models/employee');
const jwt = require('jsonwebtoken');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Register Employee (Admin)
exports.registerEmployee = async (req, res) => {
  try {
    const { fullName, employeeId, password, role, restaurantName, email, mobile } = req.body;
    if (!fullName || !employeeId || !password || !role || !restaurantName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const exists = await Employee.findOne({ employeeId });
    if (exists) return res.status(400).json({ message: 'employeeId already exists' });

    const emp = await Employee.create({ fullName, employeeId, password, role, restaurantName, email, mobile });
    res.status(201).json({
      _id: emp._id,
      fullName: emp.fullName,
      employeeId: emp.employeeId,
      role: emp.role,
      restaurantName: emp.restaurantName,
      email: emp.email,
      mobile: emp.mobile,
      token: generateToken(emp._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Employee Login
exports.loginEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await employee.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({
      _id: employee._id,
      fullName: employee.fullName,
      employeeId: employee.employeeId,
      role: employee.role,
      restaurantName: employee.restaurantName,
      email: employee.email,
      mobile: employee.mobile,
      token: generateToken(employee._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}).select("-password");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees" });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Not found' });

    const { fullName, role, restaurantName, password, email, mobile } = req.body;
    if (fullName) emp.fullName = fullName;
    if (role) emp.role = role;
    if (restaurantName) emp.restaurantName = restaurantName;
    if (password) emp.password = password;
    if (email) emp.email = email;
    if (mobile) emp.mobile = mobile;
    await emp.save();
    res.json({ message: 'Updated', employee: { _id: emp._id, fullName: emp.fullName, employeeId: emp.employeeId, role: emp.role, restaurantName: emp.restaurantName, email: emp.email, mobile: emp.mobile } });
  } catch(err){
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch(err){
    res.status(500).json({ message: 'Server error' });
  }
};
