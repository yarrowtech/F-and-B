// const express = require("express");
// const {
//   getMenu,
//   addMenuItem,
//   updateMenuItem,
//   deleteMenuItem,
// } = require("../controllers/menu.Controller");
// const router = express.Router();

// router.get("/", getMenu);
// router.post("/", addMenuItem);
// router.put("/:id", updateMenuItem);
// router.delete("/:id", deleteMenuItem);

// module.exports = router;




// const express = require("express");
// const router = express.Router();
// const { list, add, update, remove } = require("../controllers/menuController");
// const { protect, allowRoles } = require("../middleware/auth");

// router.get("/", list);
// router.post("/", protect, allowRoles("admin"), add);
// router.put("/:id", protect, allowRoles("admin"), update);
// router.delete("/:id", protect, allowRoles("admin"), remove);

// module.exports = router;



// const express = require("express");
// const router = express.Router();
// const {
//   getMenu,
//   createMenuItem,
//   updateMenuItem,
//   deleteMenuItem,
// } = require("../controllers/menu.Controller");

// // Routes
// router.get("/", getMenu);
// router.post("/", createMenuItem);
// router.put("/:id", updateMenuItem);
// router.delete("/:id", deleteMenuItem);

// module.exports = router;




// const express = require("express");
// const router = express.Router();
// const {
//   getMenu,
//   createMenuItem,
//   updateMenuItem,
//   deleteMenuItem
// } = require("../controllers/menu.Controller");

// // GET all menu items
// router.get("/", getMenu);

// // POST add a new menu item
// router.post("/", createMenuItem);

// // PUT update menu item
// router.put("/:id", updateMenuItem);

// // DELETE menu item
// router.delete("/:id", deleteMenuItem);

// module.exports = router;



// const express = require("express");
// const router = express.Router();
// const {
//   getMenu,
//   createMenuItem,
//   deleteMenuItem,
// } = require("../controllers/menu.Controller");

// router.get("/", getMenu);
// router.post("/", createMenuItem);
// router.delete("/:id", deleteMenuItem);

// module.exports = router;


// routes/menu.Routes.js
const express = require("express");
const {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/Menu.Controller");

const router = express.Router();

router.post("/", createMenuItem);
router.get("/", getMenuItems);
router.get("/:id", getMenuItemById);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

module.exports = router;


